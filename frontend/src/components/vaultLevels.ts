import type { Level } from '../api/types'

/** The vault's levels, from the highest (0) to the most basic (2). */
export const VAULT_LEVELS: { level: Level; number: number; name: string; audience: string }[] = [
  { level: 'MINISTER', number: 0, name: 'Ultrassecreto', audience: 'Ministros' },
  { level: 'MANAGER', number: 1, name: 'Secreto', audience: 'Gerentes' },
  { level: 'ANALYST', number: 2, name: 'Confidencial', audience: 'Analistas' },
]
