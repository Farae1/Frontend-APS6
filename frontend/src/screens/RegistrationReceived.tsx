import { APPROVED_BY, LEVEL_NAMES, type Level, type Registration, type RegistrationForm } from '../api/types'
import StatusSeal from '../components/StatusSeal'
import { formatDateTime } from '../format'

const APPROVER_PHRASE: Record<Level, string> = {
  ANALYST: 'um gerente ou um ministro',
  MANAGER: 'um ministro',
  MINISTER: 'o ministro base',
}

interface Props {
  form: RegistrationForm
  registration: Registration
  onHome: () => void
}

/** "Cadastro recebido": the registration is under review by someone above. */
export default function RegistrationReceived({ form, registration, onHome }: Props) {
  return (
    <main className="panel result">
      <h1>Cadastro recebido!</h1>
      <StatusSeal success />

      <section className="card" aria-label="Seu cadastro">
        <p className="card__greeting">Em análise</p>
        <p className="card__name">{form.name}</p>
        <span className={`level-tag level-tag--${form.level.toLowerCase()}`}>{LEVEL_NAMES[form.level]}</span>
        <dl>
          <div>
            <dt>Funcional</dt>
            <dd>{registration.id}</dd>
          </div>
          <div>
            <dt>Cadastro em</dt>
            <dd>{formatDateTime(registration.registeredAt)}</dd>
          </div>
          <div>
            <dt>Aprovação</dt>
            <dd>{APPROVED_BY[form.level]}</dd>
          </div>
        </dl>
      </section>

      <p className="result__text">Seu acesso será liberado assim que {APPROVER_PHRASE[form.level]} aprovar o cadastro.</p>

      <div className="actions">
        <button className="button" onClick={onHome}>
          Voltar ao início
        </button>
      </div>
    </main>
  )
}
