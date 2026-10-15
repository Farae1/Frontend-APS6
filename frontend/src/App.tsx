import { useCallback, useEffect, useState } from 'react'
import { identify, register } from './api/client'
import type { Captures, Identity, Registration, RegistrationForm, Session } from './api/types'
import { FaceCapture } from './face'
import Approvals from './screens/Approvals'
import BaseSignIn from './screens/BaseSignIn'
import Failure from './screens/Failure'
import Home from './screens/Home'
import IdentityConfirmed from './screens/IdentityConfirmed'
import Processing, { type Outcome } from './screens/Processing'
import RegisterForm from './screens/RegisterForm'
import RegistrationReceived from './screens/RegistrationReceived'
import Vault from './screens/Vault'

// The flows:
//   sign in:   home → capture → validating → identity confirmed → vault (⚙ approvals)
//   register:  home → form → capture → sending → registration received
//   base:      home ⚙ → base minister's password → approvals (every level)

type Screen =
  | { name: 'home' }
  | { name: 'login-capture' }
  | { name: 'login-processing'; captures: Captures }
  | { name: 'login-confirmed'; identity: Identity }
  | { name: 'vault'; identity: Identity }
  | { name: 'register-form'; form?: RegistrationForm }
  | { name: 'register-capture'; form: RegistrationForm }
  | { name: 'register-processing'; form: RegistrationForm; captures: Captures }
  | { name: 'register-received'; form: RegistrationForm; registration: Registration }
  | { name: 'base-sign-in' }
  | { name: 'approvals'; session: Session; back: Screen }
  | { name: 'failure'; outcome: Extract<Outcome<unknown>, { ok: false }>; retry: Screen }

/** The session shown on this screen, if any. */
function sessionOf(screen: Screen): Session | null {
  if (screen.name === 'vault' || screen.name === 'login-confirmed') return screen.identity.session
  if (screen.name === 'approvals') return screen.session
  return null
}

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' })
  const go = setScreen
  const home = useCallback(() => go({ name: 'home' }), [go])
  const session = sessionOf(screen)

  // A session lasts 10 minutes: when it ends, back to the start.
  useEffect(() => {
    if (!session) return
    const timer = setTimeout(home, Math.max(0, new Date(session.expiresAt).getTime() - Date.now()))
    return () => clearTimeout(timer)
  }, [session, home])

  switch (screen.name) {
    case 'home':
      return (
        <Home
          onLogin={() => go({ name: 'login-capture' })}
          onRegister={() => go({ name: 'register-form' })}
          onSettings={() => go({ name: 'base-sign-in' })}
        />
      )

    case 'login-capture':
      return <FaceCapture onComplete={(captures) => go({ name: 'login-processing', captures })} onCancel={home} />

    case 'login-processing':
      return (
        <Processing
          title="Validando suas informações"
          working="Verificando identidade…"
          task={() => identify(screen.captures)}
          onDone={(outcome: Outcome<Identity>) =>
            go(
              outcome.ok
                ? { name: 'login-confirmed', identity: outcome.value }
                : { name: 'failure', outcome, retry: { name: 'login-capture' } },
            )
          }
        />
      )

    case 'login-confirmed':
      return <IdentityConfirmed identity={screen.identity} onContinue={() => go({ name: 'vault', identity: screen.identity })} />

    case 'vault':
      return (
        <Vault
          identity={screen.identity}
          onSettings={() => go({ name: 'approvals', session: screen.identity.session, back: screen })}
          onSignOut={home}
          onExpired={home}
        />
      )

    case 'register-form':
      return (
        <RegisterForm initial={screen.form} onSubmit={(form) => go({ name: 'register-capture', form })} onCancel={home} />
      )

    case 'register-capture':
      return (
        <FaceCapture
          title="Cadastre sua biometria"
          onComplete={(captures) => go({ name: 'register-processing', form: screen.form, captures })}
          onCancel={() => go({ name: 'register-form', form: screen.form })}
        />
      )

    case 'register-processing':
      return (
        <Processing
          title="Enviando seu cadastro"
          working="Registrando biometria…"
          task={() => register(screen.form, screen.captures)}
          onDone={(outcome: Outcome<Registration>) =>
            go(
              outcome.ok
                ? { name: 'register-received', form: screen.form, registration: outcome.value }
                : { name: 'failure', outcome, retry: { name: 'register-capture', form: screen.form } },
            )
          }
        />
      )

    case 'register-received':
      return <RegistrationReceived form={screen.form} registration={screen.registration} onHome={home} />

    case 'base-sign-in':
      return <BaseSignIn onSignedIn={(session) => go({ name: 'approvals', session, back: { name: 'home' } })} onCancel={home} />

    case 'approvals':
      return <Approvals session={screen.session} onBack={() => go(screen.back)} onExpired={home} />

    case 'failure':
      return <Failure reason={screen.outcome.reason} onRetry={() => go(screen.retry)} onHome={home} />
  }
}
