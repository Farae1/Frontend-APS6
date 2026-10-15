import { useEffect, useState, type FormEvent } from 'react'
import { signInAsBase } from '../api/client'
import { ApiError, type FailureReason, type Session } from '../api/types'
import { Lock } from '../components/Icons'
import TouchKeyboard from '../components/TouchKeyboard'
import { useTouchKeyboard } from '../components/touchScreen'

const ERRORS: Partial<Record<FailureReason, string>> = {
  'wrong-password': 'Senha incorreta.',
  'too-many-attempts': 'Muitas tentativas erradas. Aguarde 5 minutos e tente de novo.',
  'password-not-set': 'A senha do ministro base ainda não foi definida no servidor.',
}

interface Props {
  onSignedIn: (session: Session) => void
  onCancel: () => void
}

/** The base minister's password: opens a 10-minute session to approve ministers. */
export default function BaseSignIn({ onSignedIn, onCancel }: Props) {
  const touch = useTouchKeyboard()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [visible, setVisible] = useState(false) // shows the typed password, to check it on the kiosk
  const ready = password !== '' && !sending

  const send = async () => {
    if (!ready) return
    setSending(true)
    setError('')
    try {
      onSignedIn(await signInAsBase(password))
    } catch (failure) {
      const reason = failure instanceof ApiError ? failure.reason : 'server-error'
      setError(ERRORS[reason] ?? 'Não foi possível falar com o servidor. Tente de novo.')
      setPassword('')
      setSending(false)
    }
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    send()
  }

  // With the on-screen keyboard there is no text field to focus: a physical keyboard types here too.
  useEffect(() => {
    if (!touch) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.altKey || event.metaKey) return
      if (event.key === 'Backspace') setPassword((current) => current.slice(0, -1))
      else if (event.key === 'Enter') send()
      else if (event.key.length === 1) setPassword((current) => current + event.key)
      else return
      event.preventDefault()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  const errorText = error && (
    <p className="form__error" role="alert">
      {error}
    </p>
  )
  const note = (
    <p className="form__note">
      <Lock size={16} /> A senha é criptografada no navegador antes de ser enviada.
    </p>
  )

  // The kiosk: one question, like the registration, with the on-screen keyboard at the bottom.
  if (touch) {
    return (
      <main className="panel typeform">
        <form className="typeform__form" onSubmit={submit}>
          <section className="typeform__step">
            <div className="typeform__ask typeform__ask--compact">
              <h1>Acesso do ministro base</h1>
              <p className="lead">A senha especial libera, por 10 minutos, a aprovação de todos os cadastros.</p>
              <div className="typeform__password">
                <div className={`typeform__name${password && !visible ? ' typeform__secret' : ''}${password ? '' : ' typeform__name--empty'}`} aria-label="Senha">
                  {visible ? password : '•'.repeat(password.length)}
                  <span className="typeform__caret" />
                  {!password && 'Senha'}
                </div>
                <button className="button button--link typeform__show" type="button" onPointerDown={(e) => e.preventDefault()} onClick={() => setVisible(!visible)}>
                  {visible ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
              {errorText}
              {note}
              <button className="button button--link typeform__back typeform__back--below" type="button" onClick={onCancel}>
                Voltar
              </button>
            </div>
            <TouchKeyboard
              variant="password"
              onKey={(char) => setPassword((current) => current + char)}
              onBackspace={() => setPassword((current) => current.slice(0, -1))}
              onEnter={send}
              enterEnabled={ready}
            />
          </section>
        </form>
      </main>
    )
  }

  return (
    <main className="panel">
      <h1>Acesso do ministro base</h1>
      <p className="lead">A senha especial libera, por 10 minutos, a aprovação de todos os cadastros.</p>

      <form className="form" onSubmit={submit}>
        <label className="field">
          <span>Senha</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            autoFocus
            required
          />
        </label>
        {errorText}
        {note}

        <div className="actions">
          <button className="button" type="submit" disabled={!ready}>
            {sending ? 'Verificando…' : 'Entrar'}
          </button>
          <button className="button button--link" type="button" onClick={onCancel}>
            Voltar
          </button>
        </div>
      </form>
    </main>
  )
}
