import type { Session } from '@/types'

const KEY = 'content-studio-history'
const MAX = 30

export function getHistory(): Session[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as Session[]
  } catch {
    return []
  }
}

export function saveSession(session: Session): void {
  const history = getHistory()
  const updated = [session, ...history].slice(0, MAX)
  localStorage.setItem(KEY, JSON.stringify(updated))
}

export function clearHistory(): void {
  localStorage.removeItem(KEY)
}
