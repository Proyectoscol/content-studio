import Anthropic from '@anthropic-ai/sdk'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const CATEGORY_LABELS: Record<string, string> = {
  ventas: 'Ventas y Persuasión',
  mentalidad: 'Mentalidad y Psicología del Éxito',
  productividad: 'Productividad y Gestión del Tiempo',
  crecimiento_personal: 'Crecimiento Personal y Desarrollo',
}

// Cost per million tokens in USD
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'claude-haiku-4-5-20251001': { input: 0.80, output: 4.00 },
  'claude-haiku-4-6': { input: 0.80, output: 4.00 },
  'claude-sonnet-4-5-20250929': { input: 3.00, output: 15.00 },
  'claude-sonnet-4-6': { input: 3.00, output: 15.00 },
  'claude-opus-4-5': { input: 15.00, output: 75.00 },
}

function calcCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = MODEL_PRICING[model] ?? { input: 3.00, output: 15.00 }
  return (inputTokens / 1_000_000) * pricing.input + (outputTokens / 1_000_000) * pricing.output
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
  // Default to haiku for speed — stays well within Vercel's 60s free-tier limit
  const model = (process.env.CLAUDE_MODULE2_MODEL ?? 'claude-haiku-4-5-20251001').trim()
  const topicModel = 'claude-haiku-4-5-20251001'

  let totalInputTokens = 0
  let totalOutputTokens = 0

  try {
    let finalTopic = topic?.trim()

    // If no topic, ask Claude to pick one
    if (!finalTopic) {
      const topicMsg = await client.messages.create({
        model: topicModel,
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: `Sugiere el mejor tema trending de "${CATEGORY_LABELS[category]}" para un video de YouTube de 15-20 minutos en ${lang}. Responde solo con el título del tema, sin explicación.`,
        }],
      })
      const c = topicMsg.content[0]
      finalTopic = c.type === 'text' ? c.text.trim() : CATEGORY_LABELS[category]
      totalInputTokens += topicMsg.usage.input_tokens
      totalOutputTokens += topicMsg.usage.output_tokens
    }

    // Concise outline for 15-20 min video to keep response fast
    const prompt = `Genera el outline para un video de YouTube de 15-20 minutos sobre: "${finalTopic}"
Categoría: ${CATEGORY_LABELS[category]}
Idioma: ${lang}

Estructura en Markdown (## para secciones, - para bullets):

# [TÍTULO GANCHO]

## Introducción (30-45 segundos)
[1-2 párrafos que plantean el problema y valor del video]

## [Sección 1]
- [Punto 1 - oración completa]
- [Punto 2 - oración completa]
- [Punto 3 - oración completa]
**Historia/Ejemplo:** [1-2 oraciones concretas]
**Dato/Cita:** [Estadística o cita]

[Repite para 3 secciones más]

## Conclusión y CTA
[Resumen + llamada a la acción en 1 párrafo]

Responde SOLO con el Markdown. Sin texto adicional.`

    const message = await client.messages.create({
      model,
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })

    const c = message.content[0]
    if (c.type !== 'text') {
      return res.status(500).json({ error: 'Respuesta inesperada de Claude', code: 'CLAUDE_ERROR' })
    }

    totalInputTokens += message.usage.input_tokens
    totalOutputTokens += message.usage.output_tokens

    const raw_markdown = c.text.trim()
    const titleMatch = raw_markdown.match(/^#\s+(.+)/m)
    const title = titleMatch ? titleMatch[1].trim() : finalTopic

    const cost_usd = calcCost(model, totalInputTokens, totalOutputTokens)

    return res.status(200).json({
      raw_markdown,
      title,
      usage: {
        input_tokens: totalInputTokens,
        output_tokens: totalOutputTokens,
        model,
        cost_usd,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return res.status(500).json({ error: message, code: 'CLAUDE_ERROR' })
  }
}
