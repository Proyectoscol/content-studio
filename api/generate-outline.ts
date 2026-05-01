import Anthropic from '@anthropic-ai/sdk'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const CATEGORY_LABELS: Record<string, string> = {
  ventas: 'Ventas y Persuasión',
  mentalidad: 'Mentalidad y Psicología del Éxito',
  productividad: 'Productividad y Gestión del Tiempo',
  crecimiento_personal: 'Crecimiento Personal y Desarrollo',
}

function isAuthorized(req: VercelRequest): boolean {
  const token = (req.headers['x-session-token'] as string | undefined)?.trim()
  return !!token && token === process.env.SESSION_TOKEN?.trim()
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed', code: 'FETCH_FAILED' })
  if (!isAuthorized(req)) return res.status(401).json({ error: 'No autorizado', code: 'AUTH_FAILED' })

  const { category, topic } = req.body as { category?: string; topic?: string }

  if (!category || !CATEGORY_LABELS[category]) {
    return res.status(400).json({ error: 'Categoría inválida', code: 'FETCH_FAILED' })
  }

  const lang = (process.env.SCRIPT_LANGUAGE ?? 'es').trim()
  const model = (process.env.CLAUDE_MODULE2_MODEL ?? 'claude-sonnet-4-6').trim()

  try {
    let finalTopic = topic?.trim()

    // If no topic, ask Claude to pick one
    if (!finalTopic) {
      const topicMsg = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: `Sugiere el mejor tema trending de "${CATEGORY_LABELS[category]}" para un video de YouTube de 30-40 minutos en ${lang}. Responde solo con el título del tema, sin explicación.`,
        }],
      })
      const c = topicMsg.content[0]
      finalTopic = c.type === 'text' ? c.text.trim() : CATEGORY_LABELS[category]
    }

    const prompt = `Genera el outline completo para un video de YouTube de 30-40 minutos sobre: "${finalTopic}"
Categoría: ${CATEGORY_LABELS[category]}
Idioma: ${lang}

El video debe tener aproximadamente 5,000-6,000 palabras habladas (130 palabras/min × 38 min promedio).

Estructura requerida en Markdown puro (## para secciones, - para bullets):

# [TÍTULO GANCHO - curioso, específico, orientado al beneficio]

## Introducción (30-60 segundos)
[2-3 párrafos cortos que planteen el problema y el valor del video]

## [Sección 1]
- [Punto de conversación 1 - oración completa]
- [Punto de conversación 2 - oración completa]
- [Punto de conversación 3 - oración completa]
- [Punto de conversación 4 - oración completa]
**Historia/Ejemplo:** [2-3 oraciones concretas y específicas]
**Dato/Cita:** [Estadística o cita de experto con fuente]

[Repite para 4 secciones más]

## Conclusión y CTA
[Resumen + llamada a la acción en 1 párrafo]

Responde SOLO con el Markdown. Sin texto adicional.`

    const message = await client.messages.create({
      model,
      max_tokens: 8192,
      messages: [{ role: 'user', content: prompt }],
    })

    const c = message.content[0]
    if (c.type !== 'text') {
      return res.status(500).json({ error: 'Respuesta inesperada de Claude', code: 'CLAUDE_ERROR' })
    }

    const raw_markdown = c.text.trim()
    const titleMatch = raw_markdown.match(/^#\s+(.+)/m)
    const title = titleMatch ? titleMatch[1].trim() : finalTopic

    return res.status(200).json({ raw_markdown, title })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return res.status(500).json({ error: message, code: 'CLAUDE_ERROR' })
  }
}
