import { useState } from 'react'
import { generateScripts } from '@/lib/api'
import { saveSession } from '@/lib/history'
import type { Script, ApiError } from '@/types'

export function useScriptGeneration() {
  const [scripts, setScripts] = useState<Script[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function generate() {
    setLoading(true)
    setError(null)
    try {
      const result = await generateScripts()
      setScripts(result.scripts)
      saveSession({
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        module: 'module1',
        output: result.scripts,
        label: `${result.scripts.length} scripts · ${new Date().toLocaleDateString()}`,
        usage: result.usage,
      })
    } catch (e) {
      const err = e as ApiError
      setError(err.error ?? 'Error desconocido al generar scripts.')
    } finally {
      setLoading(false)
    }
  }

  return { scripts, loading, error, generate }
}
