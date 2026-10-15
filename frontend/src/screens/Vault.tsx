import { useEffect, useRef, useState } from 'react'
import { getSecrets } from '../api/client'
import { ApiError, LEVEL_NAMES, type Identity, type Secret } from '../api/types'
import Crystal from '../components/Crystal'
import { ChevronLeft, ChevronRight } from '../components/Icons'
import SecretModal from '../components/SecretModal'
import SettingsButton from '../components/SettingsButton'
import { VAULT_LEVELS } from '../components/vaultLevels'

interface Props {
  identity: Identity
  /** The gear: approve registrations. */
  onSettings: () => void
  onSignOut: () => void
  onExpired: () => void
}

/** A horizontal swipe longer than this (px) changes the level. */
const SWIPE = 60

/**
 * The vault: the secrets of the user's level and of the levels below. The
 * arrows (or a swipe) move between levels, each level scrolls down, and a
 * secret opens in a modal.
 */
export default function Vault({ identity, onSettings, onSignOut, onExpired }: Props) {
  const [secrets, setSecrets] = useState<Secret[] | null>(null)
  const [error, setError] = useState(false)
  const [index, setIndex] = useState(0)
  const [open, setOpen] = useState<Secret | null>(null)
  const swipeStart = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    getSecrets(identity.session).then(setSecrets, (failure) =>
      failure instanceof ApiError && failure.reason === 'session-expired' ? onExpired() : setError(true),
    )
  }, [identity.session, onExpired])

  const levels = VAULT_LEVELS.filter(({ level }) => secrets?.some((secret) => secret.level === level))
  const current = levels[index]
  const go = (step: number) => setIndex((i) => Math.min(levels.length - 1, Math.max(0, i + step)))

  return (
    <main className="vault">
      <header className="vault__top">
        <div>
          <p className="vault__stamp">Cofre do Ministério</p>
          <p className="vault__who">
            {identity.name} · {LEVEL_NAMES[identity.level]}
          </p>
        </div>
        <SettingsButton onClick={onSettings} label="Aprovar cadastros" />
      </header>

      {current && (
        <nav className="vault__levels" aria-label="Níveis do cofre">
          <button className="vault__arrow" onClick={() => go(-1)} disabled={index === 0} aria-label="Nível acima">
            <ChevronLeft size={30} />
          </button>
          <div className="vault__level" aria-live="polite">
            <strong className={`secret-level secret-level--${current.number}`}>
              Nível {current.number} · {current.name}
            </strong>
            <span>{current.audience}</span>
            <ol className="vault__dots">
              {levels.map((l, i) => (
                <li key={l.level} className={i === index ? 'current' : ''} />
              ))}
            </ol>
          </div>
          <button
            className="vault__arrow"
            onClick={() => go(1)}
            disabled={index === levels.length - 1}
            aria-label="Nível abaixo"
          >
            <ChevronRight size={30} />
          </button>
        </nav>
      )}

      <div
        className="vault__viewport"
        onPointerDown={(e) => (swipeStart.current = { x: e.clientX, y: e.clientY })}
        onPointerUp={(e) => {
          const start = swipeStart.current
          swipeStart.current = null
          if (!start) return
          const dx = e.clientX - start.x
          if (Math.abs(dx) > SWIPE && Math.abs(dx) > Math.abs(e.clientY - start.y)) go(dx < 0 ? 1 : -1)
        }}
      >
        {secrets === null && <p className="vault__message">{error ? 'Não foi possível abrir o cofre.' : 'Abrindo o cofre…'}</p>}
        <div className="vault__track" style={{ transform: `translateX(-${index * 100}%)` }}>
          {levels.map((level, i) => (
            <section key={level.level} className="vault__column" inert={i !== index}>
              <ul className="vault__secrets">
                {secrets
                  ?.filter((secret) => secret.level === level.level)
                  .map((secret) => (
                    <li key={secret.code}>
                      <button className="secret-card" onClick={() => setOpen(secret)}>
                        <span className="glyph">
                          {secret.glyph === 'crystal' ? <Crystal size={34} /> : secret.glyph}
                        </span>
                        <span className="secret-card__text">
                          <span className="secret-card__code">{secret.code}</span>
                          <span className="secret-card__title">{secret.title}</span>
                          <span className="secret-card__summary">{secret.summary}</span>
                        </span>
                        <ChevronRight size={22} />
                      </button>
                    </li>
                  ))}
              </ul>
            </section>
          ))}
        </div>
      </div>

      <footer className="vault__footer">
        <button className="button button--outline" onClick={onSignOut}>
          Encerrar sessão
        </button>
      </footer>

      {open && <SecretModal secret={open} onClose={() => setOpen(null)} />}
    </main>
  )
}
