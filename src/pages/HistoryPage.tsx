import { useState, useEffect } from 'react'
import { getHistory, clearHistory } from '@/lib/history'
import type { Session, Script, Outline } from '@/types'

function isScripts(output: Script[] | Outline): output is Script[] {
  return Array.isArray(output)
}

export function HistoryPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => { setSessions(getHistory()) }, [])

  function handleClear() {
    clearHistory()
    setSessions([])
  }

  if (sessions.length === 0) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b px-6 py-4" style={{ borderColor: 'hsl(var(--border))' }}>
          <h1 className="text-base font-semibold">Historial</h1>
          <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>Últimas 30 sesiones</p>
        </div>
        <div className="flex-1 flex items-center justify-center" style={{ background: 'hsl(var(--secondary))' }}>
          <div className="text-center">
            <div className="text-3xl mb-3">🕐</div>
            <div className="font-medium mb-1">Sin historial aún</div>
            <div className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Genera scripts o un outline para ver el historial aquí
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between" style={{ borderColor: 'hsl(var(--border))' }}>
        <div>
          <h1 className="text-base font-semibold">Historial</h1>
          <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{sessions.length} sesiones guardadas</p>
        </div>
        <button
          onClick={handleClear}
          className="text-xs px-3 py-1.5 rounded-md border cursor-pointer"
          style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}
        >
          Limpiar historial
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-3" style={{ background: 'hsl(var(--secondary))' }}>
        {sessions.map((session) => (
          <div key={session.id} className="bg-white border rounded-xl overflow-hidden" style={{ borderColor: 'hsl(var(--border))' }}>
            <button
              onClick={() => setExpanded(expanded === session.id ? null : session.id)}
              className="w-full flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span
                  className="text-xs px-2 py-0.5 rounded font-medium"
                  style={
                    session.module === 'module1'
                      ? { background: '#f0f9ff', color: '#0369a1' }
                      : { background: '#fef3c7', color: '#92400e' }
                  }
                >
                  {session.module === 'module1' ? 'M1 · Scripts' : 'M2 · Deep-Dive'}
                </span>
                <span className="text-sm font-medium text-left">
                  {session.label ?? new Date(session.date).toLocaleString('es')}
                </span>
              </div>
              <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {new Date(session.date).toLocaleString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </span>
            </button>

            {expanded === session.id && (
              <div className="border-t px-4 pb-4 pt-3" style={{ borderColor: 'hsl(var(--border))' }}>
                {isScripts(session.output) ? (
                  <div className="space-y-2">
                    {session.output.map((s, i) => (
                      <div key={i} className="text-xs">
                        <span className="font-medium">{i + 1}. {s.title}</span>
                        <span className="ml-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          {s.timing.hook_s + s.timing.body_s + s.timing.cta_s}s
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <pre
                    className="text-xs leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto rounded p-3"
                    style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))', fontFamily: 'inherit' }}
                  >
                    {session.output.raw_markdown.slice(0, 1000)}
                    {session.output.raw_markdown.length > 1000 ? '\n...' : ''}
                  </pre>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
