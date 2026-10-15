import type { FailureReason } from '../api/types'
import StatusSeal from '../components/StatusSeal'

const MESSAGES: Record<FailureReason, { title: string; text: string }> = {
  'not-recognized': {
    title: 'Não foi possível confirmar sua identidade',
    text: 'Seu rosto não corresponde a nenhum servidor cadastrado.',
  },
  'pending-approval': {
    title: 'Cadastro em análise',
    text: 'Seu cadastro ainda aguarda aprovação. Tente de novo depois que ele for aprovado.',
  },
  'already-registered': {
    title: 'Rosto já cadastrado',
    text: 'Este rosto já está cadastrado. Use a opção Entrar.',
  },
  'unusable-capture': {
    title: 'Não conseguimos capturar seu rosto',
    text: 'Fique de frente para a câmera, com boa luz, e tente de novo.',
  },
  'wrong-password': {
    title: 'Senha incorreta',
    text: 'A senha do ministro base não confere.',
  },
  'too-many-attempts': {
    title: 'Acesso bloqueado',
    text: 'Muitas tentativas erradas. Aguarde 5 minutos e tente de novo.',
  },
  'password-not-set': {
    title: 'Senha não definida',
    text: 'A senha do ministro base ainda não foi definida no servidor.',
  },
  'session-expired': {
    title: 'Sessão encerrada',
    text: 'Por segurança, a sessão dura 10 minutos. Entre de novo.',
  },
  'not-allowed': {
    title: 'Sem permissão',
    text: 'Seu nível não permite esta ação.',
  },
  'server-error': {
    title: 'Algo deu errado',
    text: 'Não foi possível falar com o servidor. Tente de novo em instantes.',
  },
}

interface Props {
  reason: FailureReason
  onRetry: () => void
  onHome: () => void
}

/** When login or registration fails: why, and what to do next. */
export default function Failure({ reason, onRetry, onHome }: Props) {
  const { title, text } = MESSAGES[reason]
  return (
    <main className="panel result">
      <h1>{title}</h1>
      <StatusSeal success={false} />
      <p className="result__text">{text}</p>
      <div className="actions">
        <button className="button" onClick={onRetry}>
          Tentar de novo
        </button>
        <button className="button button--outline" onClick={onHome}>
          Voltar ao início
        </button>
      </div>
    </main>
  )
}
