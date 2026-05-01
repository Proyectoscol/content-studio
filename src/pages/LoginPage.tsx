import { useState, type FormEvent } from 'react'
import { login, storeToken } from '@/lib/api'

interface Props {
  onSuccess: () => void
}

export function LoginPage({ onSuccess }: Props) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const token = await login(password)
      storeToken(token)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center min-h-screen" style={{ background: 'hsl(var(--secondary))' }}>
      <div className="bg-white border rounded-2xl p-8 w-full max-w-sm shadow-sm" style={{ borderColor: 'hsl(var(--border))' }}>
        <div className="text-center mb-8">
          <div className="text-2xl mb-1">⚡</div>
          <h1 className="text-lg font-bold">Content Studio</h1>
          <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Ingresa tu contraseña para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'hsl(var(--foreground))' }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoFocus
              required
              className="w-full text-sm px-3 py-2.5 rounded-lg border outline-none focus:ring-1"
              style={{
                borderColor: 'hsl(var(--border))',
                background: 'hsl(var(--background))',
                color: 'hsl(var(--foreground))',
              }}
            />
          </div>

          {error && (
            <div className="text-xs text-center p-2 rounded-lg" style={{ background: '#fef2f2', color: '#991b1b' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-2.5 rounded-lg text-sm font-medium cursor-pointer disabled:opacity-50"
            style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
          >
            {loading ? 'Verificando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
