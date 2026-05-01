import { useState } from 'react'
import { generateOutline } from '@/lib/api'
import { saveSession } from '@/lib/history'
import type { Category, ApiError } from '@/types'

export function useOutlineGeneration() {
  const [markdown, setMarkdown] = useState('')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function generate(category: Category, topic?: string) {
    setLoading(true)
    setError(null)
    try {
      const result = await generateOutline(category, topic)
      setMarkdown(result.raw_markdown)
      setTitle(result.title)
      saveSession({
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        module: 'module2',
        output: { title: result.title, intro_hook: '', sections: [], conclusion: '', raw_markdown: result.raw_markdown },
        label: result.title,
        usage: result.usage,
      })
    } catch (e) {
      const err = e as ApiError
      setError(err.error ?? 'Error desconocido al generar contenido.')
    } finally {
      setLoading(false)
    }
  }

  return { markdown, title, loading, error, generate }
}
