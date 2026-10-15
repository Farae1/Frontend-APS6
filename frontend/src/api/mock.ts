import {
  ApiError,
  type Captures,
  type FailureReason,
  type Identity,
  type Level,
  type PendingRegistration,
  type Registration,
  type RegistrationForm,
  type Role,
  type Secret,
  type Session,
} from './types'

// The mocked backend, for frontend development without the containers.
// Sign in picks one of the employees at random; any password of 8+
// characters signs in as the base minister. To demo a specific outcome, add
// it to the URL:
//   ?mock=analyst | manager | minister            sign in as that level
//   ?mock=not-recognized | pending-approval | ... a request fails that way

const EMPLOYEES: Omit<Identity, 'accessedAt' | 'session'>[] = [
  { id: 'MMA-104527', name: 'Ana Beatriz Souza', level: 'ANALYST' },
  { id: 'MMA-087311', name: 'Carlos Henrique Lima', level: 'MANAGER' },
  { id: 'MMA-000002', name: 'Marina Costa Ribeiro', level: 'MINISTER' },
]

const APPROVES: Record<Role, Level[]> = { BASE: ['MINISTER', 'MANAGER', 'ANALYST'], MINISTER: ['MANAGER', 'ANALYST'], MANAGER: ['ANALYST'], ANALYST: [] }
const SEES: Record<Role, Level[]> = { BASE: [], MINISTER: ['MINISTER', 'MANAGER', 'ANALYST'], MANAGER: ['MANAGER', 'ANALYST'], ANALYST: ['ANALYST'] }

const SECRETS: Secret[] = [
  {
    code: 'MMA-Ω-000',
    level: 'MINISTER',
    glyph: '✎',
    title: 'Como colar na prova do Professor Rafael',
    summary: 'O protocolo mais bem guardado do Ministério.',
    body: 'Conclusão do estudo: a única técnica com 100% de eficácia comprovada é estudar.',
    formula: null,
  },
  {
    code: 'MMA-Ω-001',
    level: 'MINISTER',
    glyph: 'crystal',
    title: 'Cristal de Energia Infinita',
    summary: 'Fonte de energia limpa e inesgotável.',
    body: 'Uma lasca do tamanho de um grão de arroz abasteceria uma cidade por um século.',
    formula: 'E = ∞ · Δt⁻¹',
  },
  {
    code: 'MMA-Σ-103',
    level: 'MANAGER',
    glyph: '3n+1',
    title: 'A Conjectura de Collatz',
    summary: 'Todo número, cedo ou tarde, chega ao 1.',
    body: 'Status: teórica.',
    formula: 'n → n/2 (se par)     n → 3n + 1 (se ímpar)',
  },
  {
    code: 'MMA-Δ-201',
    level: 'ANALYST',
    glyph: '♻',
    title: 'O plástico que some em 7 dias',
    summary: 'Uma enzima que transforma garrafas PET em matéria-prima nova.',
    body: 'A PETase, descoberta em 2016, consegue quebrar o plástico PET.',
    formula: null,
  },
]

let pending: PendingRegistration[] = [
  { id: 'MMA-000150', name: 'Rafael Moreira', level: 'MINISTER', registeredAt: new Date().toISOString() },
  { id: 'MMA-000151', name: 'Joana Pereira', level: 'MANAGER', registeredAt: new Date().toISOString() },
  { id: 'MMA-000152', name: 'Lucas Andrade', level: 'ANALYST', registeredAt: new Date().toISOString() },
]

const FAILURES: FailureReason[] = ['not-recognized', 'pending-approval', 'already-registered', 'server-error']

const wait = (ms = 1800) => new Promise((resolve) => setTimeout(resolve, ms))
const requested = () => new URLSearchParams(window.location.search).get('mock') ?? ''

function failIfRequested() {
  const outcome = requested() as FailureReason
  if (FAILURES.includes(outcome)) throw new ApiError(outcome)
}

function session(role: Role, name: string): Session {
  return {
    token: 'mock',
    expiresAt: new Date(Date.now() + 10 * 60_000).toISOString(),
    role,
    name,
    canApprove: APPROVES[role],
  }
}

export async function identify(_captures: Captures): Promise<Identity> {
  await wait()
  failIfRequested()
  const employee =
    EMPLOYEES.find((e) => e.level === requested().toUpperCase()) ?? EMPLOYEES[Math.floor(Math.random() * EMPLOYEES.length)]
  return { ...employee, accessedAt: new Date().toISOString(), session: session(employee.level, employee.name) }
}

export async function register(_form: RegistrationForm, _captures: Captures): Promise<Registration> {
  await wait()
  failIfRequested()
  const id = `MMA-${String(Math.floor(100000 + Math.random() * 900000))}`
  return { status: 'UNDER_REVIEW', id, registeredAt: new Date().toISOString() }
}

export async function signInAsBase(password: string): Promise<Session> {
  await wait(600)
  if (password.length < 8) throw new ApiError('wrong-password')
  return session('BASE', 'Ministro base')
}

export async function getSecrets(current: Session): Promise<Secret[]> {
  await wait(300)
  return SECRETS.filter((secret) => SEES[current.role].includes(secret.level))
}

export async function getPending(current: Session): Promise<PendingRegistration[]> {
  await wait(300)
  return pending.filter((registration) => current.canApprove.includes(registration.level))
}

export async function decide(_current: Session, id: string, _decision: 'approve' | 'reject'): Promise<void> {
  await wait(400)
  pending = pending.filter((registration) => registration.id !== id)
}
