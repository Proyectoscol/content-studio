export interface Script {
  title: string
  hook: string
  body: string
  cta: string
  on_screen_actions: string[] // format: 'TEXT_OVERLAY | at_second_N'
  timing: { hook_s: number; body_s: number; cta_s: number }
}

export interface OutlineSection {
  section_title: string
  talking_points: string[]
  story_or_example: string
  data_point: string
}

export interface Outline {
  title: string
  intro_hook: string
  sections: OutlineSection[]
  conclusion: string
  raw_markdown: string
}

export type Category = 'ventas' | 'mentalidad' | 'productividad' | 'crecimiento_personal'

export interface ApiError {
  error: string
  code: 'FETCH_FAILED' | 'CLAUDE_ERROR' | 'PARSE_ERROR' | 'TIMEOUT' | 'AUTH_FAILED'
}

export interface Session {
  id: string
  date: string
  module: 'module1' | 'module2'
  output: Script[] | Outline
  label?: string
}
