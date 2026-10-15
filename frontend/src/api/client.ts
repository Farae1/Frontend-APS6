import { encryptPassword } from './crypto'
import * as mock from './mock'
import {
  ApiError,
  LEVELS,
  type Captures,
  type FailureReason,
  type Identity,
  type PendingRegistration,
  type Registration,
  type RegistrationForm,
  type Secret,
  type Session,
} from './types'

// The backend calls. Without VITE_API_URL, the mock answers instead.

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/+$/, '')

/** The reasons the API gives in `detail`, as the app names them. */
const DETAILS: Record<string, FailureReason> = {
  'not-recognized': 'not-recognized',
  'no-face': 'unusable-capture',
  'captures-differ': 'unusable-capture',
  'unusable-capture': 'unusable-capture',
  'pending-approval': 'pending-approval',
  'wrong-password': 'wrong-password',
  'expired-challenge': 'server-error',
  'too-many-attempts': 'too-many-attempts',
  'base-password-not-set': 'password-not-set',
  'session-expired': 'session-expired',
  'invalid-token': 'session-expired',
  'missing-token': 'session-expired',
  'not-allowed': 'not-allowed',
}

interface Request {
  method?: 'GET' | 'POST'
  body?: FormData | object
  session?: Session
}

async function call(path: string, { method = 'GET', body, session }: Request = {}): Promise<unknown> {
  const headers: Record<string, string> = {}
  if (session) headers.Authorization = `Bearer ${session.token}`
  if (body && !(body instanceof FormData)) headers['Content-Type'] = 'application/json'
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body instanceof FormData || body === undefined ? body : JSON.stringify(body),
  })
  if (!response.ok) {
    const detail = await response.json().then((data) => data?.detail, () => undefined)
    throw new ApiError(DETAILS[detail] ?? (response.status === 409 ? 'already-registered' : 'server-error'), `HTTP ${response.status}`)
  }
  return response.json()
}

function withCaptures(captures: Captures): FormData {
  const body = new FormData()
  body.append('capture1', captures.first, 'capture1.jpg')
  body.append('capture2', captures.second, 'capture2.jpg')
  return body
}

function invalidResponse(): never {
  throw new ApiError('server-error', 'Unexpected response from the server')
}

/** POST /identifier: sends the two captures, returns who the person is (and a session). */
export async function identify(captures: Captures): Promise<Identity> {
  if (!API_URL) return mock.identify(captures)
  const data = (await call('/identifier', { method: 'POST', body: withCaptures(captures) })) as Partial<Identity> | null
  if (typeof data?.id !== 'string' || !LEVELS.includes(data.level as Identity['level']) || !data.session?.token)
    invalidResponse()
  return data as Identity
}

/** POST /register: sends the captures with name and level; the backend puts it under review. */
export async function register(form: RegistrationForm, captures: Captures): Promise<Registration> {
  if (!API_URL) return mock.register(form, captures)
  const body = withCaptures(captures)
  body.append('name', form.name)
  body.append('level', form.level)
  const data = (await call('/register', { method: 'POST', body })) as Partial<Registration> | null
  if (typeof data?.id !== 'string' || typeof data.registeredAt !== 'string') invalidResponse()
  return { status: 'UNDER_REVIEW', id: data.id, registeredAt: data.registeredAt }
}

/** The base minister's session: the password goes encrypted (see crypto.ts). */
export async function signInAsBase(password: string): Promise<Session> {
  if (!API_URL) return mock.signInAsBase(password)
  const { publicKey, nonce } = (await call('/auth/challenge')) as { publicKey: string; nonce: string }
  const encrypted = await encryptPassword(publicKey, nonce, password)
  return (await call('/auth/base', { method: 'POST', body: { nonce, password: encrypted } })) as Session
}

/** The vault: the secrets this session's level may see. */
export async function getSecrets(session: Session): Promise<Secret[]> {
  if (!API_URL) return mock.getSecrets(session)
  return (await call('/secrets', { session })) as Secret[]
}

/** Registrations this session may approve. */
export async function getPending(session: Session): Promise<PendingRegistration[]> {
  if (!API_URL) return mock.getPending(session)
  return (await call('/registrations/pending', { session })) as PendingRegistration[]
}

export async function decide(session: Session, id: string, decision: 'approve' | 'reject'): Promise<void> {
  if (!API_URL) return mock.decide(session, id, decision)
  await call(`/registrations/${id}/${decision}`, { method: 'POST', session })
}
