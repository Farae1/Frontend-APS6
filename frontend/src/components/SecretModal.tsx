import { useEffect } from 'react'
import type { Secret } from '../api/types'
import Crystal from './Crystal'
import { Close } from './Icons'
import { VAULT_LEVELS } from './vaultLevels'

interface Props {
  secret: Secret
  onClose: () => void
}

/** One secret, to read in full. Closes on the X, on Escape or outside the panel. */
export default function SecretModal({ secret, onClose }: Props) {
  useEffect(() => {
    const close = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [onClose])

  const level = VAULT_LEVELS.find((l) => l.level === secret.level)!
  return (
    <div className="modal" onClick={onClose}>
      <article
        className="modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="secret-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="modal__close" onClick={onClose} aria-label="Fechar">
          <Close size={26} />
        </button>
        <p className={`secret-level secret-level--${level.number}`}>
          Nível {level.number} · {level.name}
        </p>
        {secret.glyph === 'crystal' ? <Crystal size={110} /> : <div className="glyph glyph--large">{secret.glyph}</div>}
        <p className="modal__code">{secret.code}</p>
        <h2 id="secret-title">{secret.title}</h2>
        {secret.formula && <pre className="formula">{secret.formula}</pre>}
        <div className="modal__body">
          {secret.body.split(/\n\s*\n/).map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      </article>
    </div>
  )
}
