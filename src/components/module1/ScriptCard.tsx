import { useState } from 'react'
import type { Script } from '@/types'

interface Props {
  script: Script
  index: number
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => null)
}

function buildScriptText(s: Script): string {
  return `HOOK (${s.timing.hook_s}s):\n${s.hook}\n\nBODY (${s.timing.body_s}s):\n${s.body}\n\nCTA (${s.timing.cta_s}s):\n${s.cta}`
}

function buildActionsText(s: Script): string {
  return s.on_screen_actions.join('\n')
}

export function ScriptCard({ script, index }: Props) {
  const [copied, setCopied] = useState<'script' | 'actions' | null>(null)
  const total = script.timing.hook_s + script.timing.body_s + script.timing.cta_s

  function copy(type: 'script' | 'actions') {
    copyToClipboard(type === 'script' ? buildScriptText(script) : buildActionsText(script))
    setCopied(type)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div className="bg-white border rounded-xl p-4 flex flex-col gap-3" style={{ borderColor: 'hsl(var(--border))' }}>
      <div>
        <div className="text-xs uppercase tracking-wider mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Script {String(index + 1).padStart(2, '0')}
        </div>
        <div className="text-sm font-semibold leading-snug">{script.title}</div>
      </div>

      <div className="flex flex-col gap-2">
        <Section label={`Hook · ${script.timing.hook_s}s`} text={script.hook} />
        <Section label={`Body · ${script.timing.body_s}s`} text={script.body} />
        <Section label={`CTA · ${script.timing.cta_s}s`} text={script.cta} />
      </div>

      {script.on_screen_actions.length > 0 && (
        <div>
          <div className="text-xs uppercase tracking-wider mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
            On-screen actions
          </div>
          <div className="text-xs rounded p-2 space-y-0.5" style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }}>
            {script.on_screen_actions.map((a, i) => (
              <div key={i}>{a}</div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-1.5 pt-1">
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
          Hook {script.timing.hook_s}s
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
          Body {script.timing.body_s}s
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
          CTA {script.timing.cta_s}s
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
          {total}s total
        </span>
      </div>

      <div className="flex gap-2 pt-2 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
        <button
          onClick={() => copy('script')}
          className="flex-1 text-xs py-1.5 rounded-md border transition-colors cursor-pointer"
          style={{ borderColor: 'hsl(var(--border))', color: copied === 'script' ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }}
        >
          {copied === 'script' ? '✓ Copiado' : 'Copiar Script'}
        </button>
        <button
          onClick={() => copy('actions')}
          className="flex-1 text-xs py-1.5 rounded-md border transition-colors cursor-pointer"
          style={{ borderColor: 'hsl(var(--border))', color: copied === 'actions' ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }}
        >
          {copied === 'actions' ? '✓ Copiado' : 'Copiar Acciones'}
        </button>
      </div>
    </div>
  )
}

function Section({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{label}</div>
      <div className="text-xs leading-relaxed rounded px-2 py-1.5 border" style={{ background: 'hsl(var(--muted) / 0.4)', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}>
        {text}
      </div>
    </div>
  )
}
