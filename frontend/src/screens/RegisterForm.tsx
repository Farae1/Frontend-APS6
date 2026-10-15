import { useEffect, useState, type FormEvent } from 'react'
import { APPROVED_BY, LEVEL_NAMES, LEVELS, type Level, type RegistrationForm } from '../api/types'
import TouchKeyboard from '../components/TouchKeyboard'
import { useTouchKeyboard } from '../components/touchScreen'

interface Props {
  initial?: RegistrationForm
  onSubmit: (form: RegistrationForm) => void
  onCancel: () => void
}

const PARTICLES = new Set(['da', 'das', 'de', 'do', 'dos', 'e'])

/** Name case as typed on the keyboard: each word capitalized, except particles ("da", "dos") after the first word,
 * once the word is finished. */
function nameCase(text: string): string {
  const words = text.split(' ')
  return words
    .map((word, i) => {
      const lower = word.toLowerCase()
      const finished = i < words.length - 1
      if (i > 0 && finished && PARTICLES.has(lower)) return lower
      return lower.replace(/(^|['-])(\p{L})/gu, (_, sep: string, letter: string) => sep + letter.toUpperCase())
    })
    .join(' ')
}

/** Registration, part 1, one question at a time (name, then level). Part 2 is the face capture. */
export default function RegisterForm({ initial, onSubmit, onCancel }: Props) {
  const touch = useTouchKeyboard()
  const [step, setStep] = useState<'name' | 'level'>(initial ? 'level' : 'name')
  const [name, setName] = useState(initial?.name ?? '')
  const [level, setLevel] = useState<Level | null>(initial?.level ?? null)
  const nameValid = name.trim().length >= 3

  const type = (char: string) =>
    setName((current) => (char === ' ' && (current === '' || current.endsWith(' ')) ? current : nameCase(current + char)))
  const erase = () => setName((current) => nameCase(current.slice(0, -1)))
  const next = () => {
    if (nameValid) {
      setName(name.trim())
      setStep('level')
    }
  }

  // With the on-screen keyboard there is no text field to focus: a physical keyboard types here too.
  useEffect(() => {
    if (!touch || step !== 'name') return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.altKey || event.metaKey) return
      if (event.key === 'Backspace') erase()
      else if (event.key === 'Enter') next()
      else if (/^[\p{L}' -]$/u.test(event.key)) type(event.key)
      else return
      event.preventDefault()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (step === 'name') next()
    else if (level !== null) onSubmit({ name: name.trim(), level })
  }

  const firstName = name.trim().split(' ')[0]

  return (
    <main className="panel typeform">
      <form className="typeform__form" onSubmit={submit}>
        {step === 'name' ? (
          <section className="typeform__step" key="name">
            <div className="typeform__ask">
              <p className="typeform__count">1 de 2 →</p>
              <h1>Qual é o seu nome completo?</h1>
              {touch ? (
              <div className={`typeform__name${name ? '' : ' typeform__name--empty'}`} aria-live="polite">
                {name}
                <span className="typeform__caret" />
                {!name && 'Seu nome'}
              </div>
            ) : (
              <input
                className="typeform__input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                placeholder="Seu nome"
                autoFocus
              />
            )}
              {/* With the keyboard at the bottom of the screen, "Voltar" goes right below the name, centered. */}
              {touch && (
                <button className="button button--link typeform__back typeform__back--below" type="button" onClick={onCancel}>
                  Voltar
                </button>
              )}
            </div>
            {!touch && nameValid && (
              <div className="typeform__actions">
                <button className="button" type="submit">
                  OK →
                </button>
              </div>
            )}
            {!touch && (
              <button className="button button--link typeform__back" type="button" onClick={onCancel}>
                Voltar
              </button>
            )}
            {touch && <TouchKeyboard onKey={type} onBackspace={erase} onEnter={next} enterEnabled={nameValid} />}
          </section>
        ) : (
          <section className="typeform__step" key="level">
            <p className="typeform__count">2 de 2 →</p>
            <h1>Qual é o seu cargo, {firstName}?</h1>
            <div className="levels typeform__levels" role="radiogroup">
              {LEVELS.map((option) => (
                <label key={option} className={`level-option${level === option ? ' level-option--selected' : ''}`}>
                  <input type="radio" name="level" value={option} checked={level === option} onChange={() => setLevel(option)} />
                  <span className="level-option__name">{LEVEL_NAMES[option]}</span>
                  <span className="level-option__note">Aprovado por: {APPROVED_BY[option]}</span>
                </label>
              ))}
            </div>
            {level !== null && (
              <div className="typeform__actions">
                <button className="button" type="submit">
                  Continuar para a biometria
                </button>
              </div>
            )}
            <button className="button button--link typeform__back" type="button" onClick={() => setStep('name')}>
              Voltar
            </button>
          </section>
        )}
      </form>
    </main>
  )
}
