import { LEVEL_NAMES, type Identity } from '../api/types'
import StatusSeal from '../components/StatusSeal'
import { formatDateTime } from '../format'

interface Props {
  identity: Identity
  onContinue: () => void
}

/** "Identidade confirmada!": who the person is, before the vault. */
export default function IdentityConfirmed({ identity, onContinue }: Props) {
  return (
    <main className="panel result">
      <h1>Identidade confirmada!</h1>
      <StatusSeal success />

      <section className="card" aria-label="Seus dados de acesso">
        <p className="card__greeting">Olá,</p>
        <p className="card__name">{identity.name}</p>
        <span className={`level-tag level-tag--${identity.level.toLowerCase()}`}>{LEVEL_NAMES[identity.level]}</span>
        <dl>
          <div>
            <dt>Funcional</dt>
            <dd>{identity.id}</dd>
          </div>
          <div>
            <dt>Acesso em</dt>
            <dd>{formatDateTime(identity.accessedAt)}</dd>
          </div>
        </dl>
      </section>

      <div className="actions">
        <button className="button" onClick={onContinue}>
          Abrir o cofre
        </button>
      </div>
    </main>
  )
}
