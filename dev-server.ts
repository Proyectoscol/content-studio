import 'dotenv/config'
import express from 'express'
import type { Request, Response, NextFunction } from 'express'

async function loadHandler(name: string) {
  const mod = await import(`./api/${name}.ts`)
  return mod.default as (req: Request, res: Response) => Promise<void>
}

const app = express()
app.use(express.json())

app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (_req.method === 'OPTIONS') { res.sendStatus(200); return }
  next()
})

app.all('/api/generate-scripts', async (req: Request, res: Response) => {
  const handler = await loadHandler('generate-scripts')
  await handler(req, res)
})

app.all('/api/generate-outline', async (req: Request, res: Response) => {
  const handler = await loadHandler('generate-outline')
  await handler(req, res)
})

app.listen(3001, () => console.log('API dev server → http://localhost:3001'))
