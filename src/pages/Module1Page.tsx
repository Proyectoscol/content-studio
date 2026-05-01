import { useScriptGeneration } from '@/hooks/useScriptGeneration'
import { ScriptCard } from '@/components/module1/ScriptCard'

export function Module1Page() {
  const { scripts, loading, error, generate } = useScriptGeneration()

  function copyAll() {
    const text = scripts
      .map((s, i) => `--- Script ${i + 1}: ${s.title} ---\nHOOK: ${s.hook}\nBODY: ${s.body}\nCTA: ${s.cta}`)
      .join('\n\n')
    navigator.clipboard.writeText(text).catch(() => null)
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between" style={{ borderColor: 'hsl(var(--border))' }}>
        <div>
          <h1 className="text-base font-semibold">IA News Scripts — Módulo 1</h1>
          <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Genera 8 scripts · 15-30 seg · Pipeline HN + Reddit
          </p>
        </div>
        <div className="flex items-center gap-2">
          {scripts.length > 0 && (
            <button
              onClick={copyAll}
              className="text-xs px-3 py-1.5 rounded-md border cursor-pointer"
              style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}
            >
              Copiar Todo
            </button>
          )}
          <button
            onClick={generate}
            disabled={loading}
            className="text-sm px-4 py-2 rounded-md font-medium cursor-pointer disabled:opacity-60"
            style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
          >
            {loading ? '⚙ Generando...' : '⚡ Generar 8 Scripts'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6" style={{ background: 'hsl(var(--secondary))' }}>
        {error && (
          <div className="mb-4 p-3 rounded-lg text-sm border" style={{ background: '#fef2f2', borderColor: '#fecaca', color: '#991b1b' }}>
            {error}
          </div>
        )}

        {loading && (
          <div className="bg-white border rounded-xl p-8 text-center mb-6" style={{ borderColor: 'hsl(var(--border))' }}>
            <div className="text-sm font-medium mb-3">Buscando temas de IA trending...</div>
            <div className="h-1 rounded-full overflow-hidden mx-auto max-w-xs" style={{ background: 'hsl(var(--muted))' }}>
              <div className="h-full w-3/5 rounded-full animate-pulse" style={{ background: 'hsl(var(--primary))' }} />
            </div>
            <div className="text-xs mt-3" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Leyendo Hacker News + Reddit · Filtrando calidad · ~3 min
            </div>
          </div>
        )}

        {!loading && scripts.length === 0 && !error && (
          <div className="bg-white border rounded-xl p-12 text-center" style={{ borderColor: 'hsl(var(--border))' }}>
            <div className="text-3xl mb-3">⚡</div>
            <div className="font-medium mb-1">Listo para generar</div>
            <div className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Haz click en "Generar 8 Scripts" para empezar
            </div>
          </div>
        )}

        {scripts.length > 0 && (
          <>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-sm font-semibold">{scripts.length} Scripts Generados</h2>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
                {new Date().toLocaleDateString('es', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {scripts.map((script, i) => (
                <ScriptCard key={i} script={script} index={i} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
