// The data exchanged with the backend.

/** Hierarchy level, from lowest to highest. */
export type Level = 'ANALYST' | 'MANAGER' | 'MINISTER'

export const LEVELS: Level[] = ['ANALYST', 'MANAGER', 'MINISTER']

export const LEVEL_NAMES: Record<Level, string> = {
  ANALYST: 'Analista',
  MANAGER: 'Gerente',
  MINISTER: 'Ministro do Meio Ambiente',
}

/** The role of a session: an employee's level, or the base minister (password). */
export type Role = Level | 'BASE'

/** Who approves each registration (see the hierarchy in the main README). */
export const APPROVED_BY: Record<Level, string> = {
  ANALYST: 'gerente ou ministro',
  MANAGER: 'ministro',
  MINISTER: 'ministro base',
}

/** The two face photos (see src/face). */
export interface Captures {
  first: Blob
  second: Blob
}

/** A signed-in session (face or base minister's password), valid until expiresAt. */
export interface Session {
  token: string
  expiresAt: string
  role: Role
  name: string
  /** The registration levels this session may approve. */
  canApprove: Level[]
}

/** Response of POST /identifier: who the face belongs to, and their session. */
export interface Identity {
  /** The employee's id (the "funcional"). */
  id: string
  name: string
  level: Level
  /** When this access happened, ISO 8601. */
  accessedAt: string
  session: Session
}

/** A secret of the vault. */
export interface Secret {
  code: string
  level: Level
  /** A short symbol for the card ("crystal" draws the crystal). */
  glyph: string
  title: string
  summary: string
  body: string
  formula: string | null
}

/** A registration waiting for approval. */
export interface PendingRegistration {
  id: string
  name: string
  level: Level
  registeredAt: string
}

/** What the user fills in to register. */
export interface RegistrationForm {
  name: string
  level: Level
}

/** Response of POST /register: received and waiting for approval. */
export interface Registration {
  status: 'UNDER_REVIEW'
  /** The employee id created by the backend. */
  id: string
  /** When the registration was received, ISO 8601. */
  registeredAt: string
}

export type FailureReason =
  | 'not-recognized'
  | 'pending-approval'
  | 'already-registered'
  | 'unusable-capture'
  | 'wrong-password'
  | 'too-many-attempts'
  | 'password-not-set'
  | 'session-expired'
  | 'not-allowed'
  | 'server-error'

/** A request the backend refused, with the reason. */
export class ApiError extends Error {
  readonly reason: FailureReason

  constructor(reason: FailureReason, message: string = reason) {
    super(message)
    this.name = 'ApiError'
    this.reason = reason
  }
}
