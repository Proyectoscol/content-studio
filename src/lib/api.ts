import type { Script, Category, ApiError } from '@/types'

const BASE = import.meta.env.DEV ? 'http://localhost:3001' : ''
const TOKEN_KEY = 'cs-session-token'

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)?.trim() ?? null
}

export function storeToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token.trim())
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

async function post<T>(path: string, body: object): Promise<T> {
  const token = getStoredToken()
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'x-session-token': token } : {}),
    },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (res.status === 401 && (data as ApiError).code === 'AUTH_FAILED') {
    clearToken()
    window.location.reload()
  }
  if (!res.ok) throw data as ApiError
  return data as T
}

export async function login(password: string): Promise<string> {
  const res = await fetch(`${BASE}/api/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Error de autenticación')
  return data.token as string
}

export function generateScripts(): Promise<Script[]> {
  return post<Script[]>('/api/generate-scripts', {})
}

export function generateOutline(category: Category, topic?: string): Promise<{ raw_markdown: string; title: string }> {
  return post<{ raw_markdown: string; title: string }>('/api/generate-outline', { category, topic })
}
