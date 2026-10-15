import { useState, type PointerEvent } from 'react'

/** A key: a character, the erase key, or empty space. `width` is in letter keys; every row adds up to 10, so the
 * keys line up in columns across the whole screen. */
type Key = { char: string; width?: number } | { erase: true; width: number } | { gap: number }

const row = (chars: string) => [...chars].map((char): Key => ({ char }))
const ERASE: Key = { erase: true, width: 2 }

const LETTERS: Key[][] = [
  row('QWERTYUIOP'),
  row('ASDFGHJKLÇ'),
  [{ gap: 0.5 }, ...row('ZXCVBNM'), ERASE, { gap: 0.5 }],
]

const ACCENTS: Key[][] = [
  row('ÁÀÂÃÉÊÍÓÔÕ'),
  [...row("ÚÜÑ'-"), { gap: 5 }],
  [{ gap: 7.5 }, ERASE, { gap: 0.5 }],
]

const DIGITS: Key[] = row('1234567890')

interface Props {
  onKey: (char: string) => void
  onBackspace: () => void
  onEnter: () => void
  enterEnabled: boolean
  /** "name": capitals and accents (the form fixes the case). "password": digits on top, lower case, and ⇧ for
   * capitals. */
  variant?: 'name' | 'password'
}

/** An on-screen keyboard across the whole width of the screen: letters, space, erase and OK; accents for names,
 * digits for passwords. */
export default function TouchKeyboard({ onKey, onBackspace, onEnter, enterEnabled, variant = 'name' }: Props) {
  const [alternate, setAlternate] = useState(false) // accents (name) or capitals (password)
  const password = variant === 'password'
  const rows = password ? [DIGITS, ...LETTERS] : alternate ? ACCENTS : LETTERS
  const show = (char: string) => (password && !alternate ? char.toLowerCase() : char)

  // Keys act on pointer down (faster on a touch screen) and never take the focus.
  const press = (action: () => void) => (event: PointerEvent) => {
    event.preventDefault()
    action()
  }
  const grow = (width = 1) => ({ flexGrow: width })

  return (
    <div className={`keyboard${password ? ' keyboard--five-rows' : ''}`} role="group" aria-label="Teclado">
      {rows.map((keys, i) => (
        <div className="keyboard__row" key={i}>
          {keys.map((key, j) =>
            'gap' in key ? (
              <span key={j} style={grow(key.gap)} />
            ) : 'erase' in key ? (
              <button type="button" key={j} className="keyboard__key keyboard__key--wide" style={grow(key.width)} aria-label="Apagar" onPointerDown={press(onBackspace)}>
                ⌫
              </button>
            ) : (
              <button type="button" key={j} className="keyboard__key" style={grow(key.width)} onPointerDown={press(() => onKey(show(key.char)))}>
                {show(key.char)}
              </button>
            ),
          )}
        </div>
      ))}
      <div className="keyboard__row">
        <button
          type="button"
          className={`keyboard__key keyboard__key--wide${password && alternate ? ' keyboard__key--on' : ''}`}
          style={grow(2)}
          aria-label={password ? 'Maiúsculas' : undefined}
          onPointerDown={press(() => setAlternate(!alternate))}
        >
          {password ? '⇧' : alternate ? 'ABC' : 'ÁÇ'}
        </button>
        <button type="button" className="keyboard__key keyboard__key--space" style={grow(5.5)} aria-label="Espaço" onPointerDown={press(() => onKey(' '))}>
          espaço
        </button>
        <button
          type="button"
          className="keyboard__key keyboard__key--enter"
          style={grow(2.5)}
          disabled={!enterEnabled}
          onPointerDown={press(() => enterEnabled && onEnter())}
        >
          {password ? 'Entrar →' : 'OK →'}
        </button>
      </div>
    </div>
  )
}
