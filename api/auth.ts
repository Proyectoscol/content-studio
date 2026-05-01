import type { VercelRequest, VercelResponse } from '@vercel/node'

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { password } = req.body as { password?: string }
  const sitePassword = process.env.SITE_PASSWORD?.trim()
  const sessionToken = process.env.SESSION_TOKEN?.trim()

  if (!sitePassword || !sessionToken) return res.status(500).json({ error: 'Server misconfigured' })
  if (!password || password.trim() !== sitePassword) {
    return res.status(401).json({ error: 'Contraseña incorrecta' })
  }

  return res.status(200).json({ token: sessionToken })
}
