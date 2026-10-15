import { useCallback, useEffect, useState } from 'react'
import { decide, getPending } from '../api/client'
import { ApiError, LEVEL_NAMES, type PendingRegistration, type Session } from '../api/types'
import { formatDateTime } from '../format'

interface Props {
  session: Session
  onBack: () => void
  /** The session ended (expired or refused): back to the start. */
  onExpired: () => void
}

/** The registrations this session may approve, oldest first. */
export default function Approvals({ session, onBack, onExpired }: Props) {
  const [pending, setPending] = useState<PendingRegistration[] | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')

  const handle = useCallback(
    (failure: unknown) => {
      if (failure instanceof ApiError && failure.reason === 'session-expired') onExpired()
      else setError('Não foi possível falar com o servidor. Tente de novo.')
    },
    [onExpired],
  )

  useEffect(() => {
    if (session.canApprove.length === 0) return
    getPending(session).then(setPending, handle)
  }, [session, handle])

  const act = async (registration: PendingRegistration, decision: 'approve' | 'reject') => {
    setBusy(registration.id)
    setError('')
    try {
      await decide(session, registration.id, decision)
      setPending((list) => list?.filter((r) => r.id !== registration.id) ?? null)
    } catch (failure) {
      handle(failure)
    } finally {
      setBusy(null)
    }
  }

  const who = session.role === 'BASE' ? 'Ministro base' : session.name
  const scope =
    session.canApprove.length === 3
      ? 'todos os cargos'
      : session.canApprove.map((level) => LEVEL_NAMES[level].toLowerCase()).join(' e ')

  return (
    <main className="panel approvals">
      <h1>Aprovação de cadastros</h1>
      <p className="lead">
        {who}
        {session.canApprove.length > 0 ? ` · aprova: ${scope}` : ''}
      </p>

      {session.canApprove.length === 0 ? (
        <p className="approvals__empty">Analistas não aprovam cadastros.</p>
      ) : pending === null && !error ? (
        <p className="approvals__empty">Carregando…</p>
      ) : pending?.length === 0 ? (
        <p className="approvals__empty">Nenhum cadastro aguardando aprovação.</p>
      ) : (
        <ul className="approvals__list">
          {pending?.map((registration) => (
            <li key={registration.id} className="approval">
              <div>
                <p className="approval__name">{registration.name}</p>
                <p className="approval__meta">
                  <span className={`level-tag level-tag--${registration.level.toLowerCase()}`}>
                    {LEVEL_NAMES[registration.level]}
                  </span>
                  {registration.id} · {formatDateTime(registration.registeredAt)}
                </p>
              </div>
              <div className="approval__actions">
                <button className="button button--small" disabled={busy !== null} onClick={() => act(registration, 'approve')}>
                  Aprovar
                </button>
                <button
                  className="button button--small button--outline"
                  disabled={busy !== null}
                  onClick={() => act(registration, 'reject')}
                >
                  Recusar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {error && (
        <p className="form__error" role="alert">
          {error}
        </p>
      )}

      <div className="actions">
        <button className="button button--outline" onClick={onBack}>
          Voltar
        </button>
      </div>
    </main>
  )
}
