import Anthropic from '@anthropic-ai/sdk'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const AI_KEYWORDS = ['model', 'gpt', 'claude', 'agent', 'llm', 'neural', 'openai', 'anthropic', ' ai ', 'machine learning', 'deep learning', 'transformer', 'mistral', 'gemini', 'chatbot', 'generative']

interface HNItem {
  id: number
  title: string
  url?: string
  score: number
  time: number
  type: string
}

interface RedditPost {
  data: {
    title: string
    score: number
    created_utc: number
    url: string
    subreddit: string
  }
}

interface RawTopic {
  title: string
  score: number
  recency_hours: number
  source: string
}

function aiKeywordPresence(title: string): number {
  const lower = title.toLowerCase()
  const count = AI_KEYWORDS.filter(k => lower.includes(k)).length
  return Math.min(count, 3) / 3
}

function qualityScore(t: RawTopic): number {
  const recencyFactor = Math.pow(Math.max(t.recency_hours, 0.1), -0.3)
  const upvotesFactor = Math.pow(Math.max(t.score, 1), 0.5)
  const kw = aiKeywordPresence(t.title)
  return upvotesFactor * recencyFactor * (kw > 0 ? kw : 0.1)
}

function jaccard(a: string, b: string): number {
  const sa = new Set(a.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(Boolean))
  const sb = new Set(b.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(Boolean))
  const intersection = [...sa].filter(w => sb.has(w)).length
  const union = new Set([...sa, ...sb]).size
  return union === 0 ? 0 : intersection / union
}

async function fetchHN(): Promise<RawTopic[]> {
  const now = Date.now() / 1000
  try {
    const ids: number[] = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json')
      .then(r => r.json())
    const top30 = ids.slice(0, 30)
    const items = await Promise.all(
      top30.map(id =>
        fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
          .then(r => r.json() as Promise<HNItem>)
          .catch(() => null)
      )
    )
    return items
      .filter((item): item is HNItem => item !== null && item.type === 'story' && !!item.title)
      .map(item => ({
        title: item.title,
        score: item.score ?? 0,
        recency_hours: (now - item.time) / 3600,
        source: 'HN',
      }))
  } catch {
    return []
  }
}

async function fetchReddit(): Promise<RawTopic[]> {
  const now = Date.now() / 1000
  const subreddits = ['artificial', 'MachineLearning', 'ChatGPT']
  const results = await Promise.all(
    subreddits.map(sub =>
      fetch(`https://www.reddit.com/r/${sub}/top.json?limit=15&t=day`, {
        headers: { 'User-Agent': 'content-studio/1.0' },
      })
        .then(r => r.json())
        .then(data => (data?.data?.children as RedditPost[] ?? []).map(p => ({
          title: p.data.title,
          score: p.data.score ?? 0,
          recency_hours: (now - p.data.created_utc) / 3600,
          source: `Reddit/r/${sub}`,
        })))
        .catch(() => [] as RawTopic[])
    )
  )
  return results.flat()
}

function deduplicate(topics: RawTopic[]): RawTopic[] {
  const kept: RawTopic[] = []
  for (const topic of topics) {
    const isDuplicate = kept.some(k => jaccard(k.title, topic.title) > 0.5)
    if (!isDuplicate) {
      kept.push(topic)
    } else {
      // Replace with higher-score item
      const idx = kept.findIndex(k => jaccard(k.title, topic.title) > 0.5)
      if (topic.score > kept[idx].score) kept[idx] = topic
    }
  }
  return kept
}

function isAuthorized(req: VercelRequest): boolean {
  const token = (req.headers['x-session-token'] as string | undefined)?.trim()
  return !!token && token === process.env.SESSION_TOKEN?.trim()
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed', code: 'FETCH_FAILED' })
  if (!isAuthorized(req)) return res.status(401).json({ error: 'No autorizado', code: 'AUTH_FAILED' })

  try {
    const [hnTopics, redditTopics] = await Promise.all([fetchHN(), fetchReddit()])
    const all = [...hnTopics, ...redditTopics]
    const deduped = deduplicate(all)
    const scored = deduped
      .map(t => ({ ...t, qs: qualityScore(t) }))
      .sort((a, b) => b.qs - a.qs)

    const selected = scored.slice(0, 8)

    if (selected.length < 4) {
      return res.status(422).json({
        error: 'No hay suficientes temas de IA hoy. Intenta de nuevo en unas horas.',
        code: 'FETCH_FAILED',
      })
    }

    const lang = (process.env.SCRIPT_LANGUAGE ?? 'es').trim()
    const model = (process.env.CLAUDE_MODULE1_MODEL ?? 'claude-haiku-4-5-20251001').trim()

    const prompt = `Eres un creador de contenido de IA. Escribe scripts para ${selected.length} videos cortos de 15-30 segundos sobre noticias de IA en idioma "${lang}".

Para cada tema, genera un objeto JSON con exactamente estos campos:
- title: string (título del video, llamativo)
- hook: string (primeros 3 segundos, ganchos de atención, 1-2 oraciones cortas)
- body: string (cuerpo del video, 10-20 segundos, el contenido de la noticia explicado claramente)
- cta: string (llamada a la acción final, 5 segundos, 1 oración)
- on_screen_actions: string[] (acciones visuales en pantalla, formato: "TEXTO | at_second_N")
- timing: object con hook_s, body_s, cta_s (números enteros en segundos)

Responde SOLO con un JSON array. Sin texto adicional, sin markdown, sin explicaciones.

Temas:
${selected.map((t, i) => `${i + 1}. ${t.title}`).join('\n')}`

    const message = await client.messages.create({
      model,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      return res.status(500).json({ error: 'Respuesta inesperada de Claude', code: 'CLAUDE_ERROR' })
    }

    let scripts
    try {
      const text = content.text.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '')
      scripts = JSON.parse(text)
    } catch {
      return res.status(500).json({ error: 'Error parseando respuesta de Claude', code: 'PARSE_ERROR' })
    }

    return res.status(200).json(scripts)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return res.status(500).json({ error: message, code: 'CLAUDE_ERROR' })
  }
}
