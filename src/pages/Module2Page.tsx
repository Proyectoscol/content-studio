import { useState } from 'react'
import { useOutlineGeneration } from '@/hooks/useOutlineGeneration'
import type { Category } from '@/types'

const CATEGORIES: { value: Category; label: string; icon: string }[] = [
  { value: 'ventas', label: 'Ventas', icon: '💰' },
  { value: 'mentalidad', label: 'Mentalidad', icon: '🧠' },
  { value: 'productividad', label: 'Productividad', icon: '⚡' },
  { value: 'crecimiento_personal', label: 'Crecimiento Personal', icon: '🌱' },
]

export function Module2Page() {
  const { markdown, title, loading, error, generate } = useOutlineGeneration()
  const [category, setCategory] = useState<Category>('ventas')
  const [topic, setTopic] = useState('')
  const [copied, setCopied] = useState(false)

  function handleGenerate() {
    generate(category, topic.trim() || undefined)
  }

  function handleCopy() {
    navigator.clipboard.writeText(markdown).catch(() => null)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between" style={{ borderColor: 'hsl(var(--border))' }}>
        <div>
          <h1 className="text-base font-semibold">Lifestyle Deep-Dive — Módulo 2</h1>
          <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
            30-40 min · Outline completo para Google Docs
          </p>
        </div>
        {markdown && (
          <button
            onClick={handleCopy}
            className="text-sm px-4 py-2 rounded-md font-medium cursor-pointer"
            style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
          >
            {copied ? '✓ Copiado' : '📋 Copiar Todo'}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6" style={{ background: 'hsl(var(--secondary))' }}>
        {error && (
          <div className="mb-4 p-3 rounded-lg text-sm border" style={{ background: '#fef2f2', borderColor: '#fecaca', color: '#991b1b' }}>
            {error}
          </div>
        )}

        {/* Setup panel */}
        <div className="bg-white border rounded-xl p-5 mb-5" style={{ borderColor: 'hsl(var(--border))' }}>
          <div className="text-sm font-semibold mb-4">Configurar contenido</div>

          <div className="mb-4">
            <div className="text-xs uppercase tracking-wider mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>Categoría</div>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium cursor-pointer transition-colors"
                  style={{
                    borderColor: category === c.value ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                    background: category === c.value ? 'hsl(var(--primary))' : 'transparent',
                    color: category === c.value ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
                  }}
                >
                  <span>{c.icon}</span> {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <div className="text-xs uppercase tracking-wider mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Tema (opcional — si está vacío, Claude elige el mejor tema trending)
            </div>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ej: Cómo cerrar ventas en frío con IA..."
              className="w-full text-sm px-3 py-2 rounded-lg border outline-none"
              style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full text-sm py-2.5 rounded-lg font-medium cursor-pointer disabled:opacity-60"
            style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
          >
            {loading ? '⚙ Generando outline...' : '📹 Generar Deep-Dive'}
          </button>
        </div>

        {loading && (
          <div className="bg-white border rounded-xl p-8 text-center" style={{ borderColor: 'hsl(var(--border))' }}>
            <div className="text-sm font-medium mb-3">Creando outline para 30-40 minutos de contenido...</div>
            <div className="h-1 rounded-full overflow-hidden mx-auto max-w-xs" style={{ background: 'hsl(var(--muted))' }}>
              <div className="h-full w-2/3 rounded-full animate-pulse" style={{ background: 'hsl(var(--primary))' }} />
            </div>
            <div className="text-xs mt-3" style={{ color: 'hsl(var(--muted-foreground))' }}>
              ~2-3 minutos · Claude Sonnet generando estructura completa
            </div>
          </div>
        )}

        {markdown && !loading && (
          <div className="bg-white border rounded-xl p-5" style={{ borderColor: 'hsl(var(--border))' }}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-xs uppercase tracking-wider mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Título</div>
                <div className="font-semibold text-base leading-snug">{title}</div>
              </div>
            </div>
            <div className="text-xs uppercase tracking-wider mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Outline completo (listo para Google Docs)
            </div>
            <pre
              className="text-xs leading-relaxed rounded-lg p-4 overflow-x-auto whitespace-pre-wrap"
              style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))', fontFamily: 'inherit' }}
            >
              {markdown}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
