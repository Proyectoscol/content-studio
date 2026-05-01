# Claude Code Session — Content Studio
### YC Summer 2026 Application · Coding Agent Transcript
**Date:** May 1, 2026  
**Duration:** ~90 minutes  
**Tool:** Claude Code (claude-sonnet-4-6) with /office-hours + /gstack skills  
**Result:** Design doc → deployed full-stack app → GitHub + Vercel production

---

## What I built

A full-stack content creation platform that generates AI-powered scripts and video outlines daily.

- **Module 1:** Scrapes Hacker News + Reddit in real-time, deduplicates and scores topics by AI relevance, generates 8 short-form video scripts (15-30 sec each) via Claude API in one click
- **Module 2:** Generates complete 30-40 minute lifestyle deep-dive outlines (sales, mindset, productivity) ready to paste into Google Docs
- **Stack:** React 18 + TypeScript + Tailwind + Vite · Vercel serverless functions · No database (localStorage) · Password-protected

**Live:** https://content-studio-olive-delta.vercel.app  
**Repo:** https://github.com/Proyectoscol/content-studio

---

## Session transcript

### Phase 1 — /office-hours design session

I started with a fully-formed technical plan. The agent ran it through a structured diagnostic before touching any code.

**Agent's first forcing question:**
> "What's the strongest evidence you have that someone actually needs this — not 'is interested,' not 'signed up for a waitlist,' but would be genuinely upset if it disappeared tomorrow?"

**My answer:** I'm the content creator who needs it. The friction is so high I haven't started creating content yet — this tool would unlock it.

**Agent's response (verbatim):**
> "That's a real flag — 'the tool would unlock it' is a bet that tooling is the bottleneck, not time, ideas, or distribution. Worth probing before we design the wrong thing."

It then asked what my content output would look like in 3 months. My answer: 8 AI news videos per day + 1 long-form lifestyle video per day.

---

### Phase 2 — Landscape research + EUREKA moment

The agent searched for existing tools (Synthesia, VEED, InVideo, etc.) then synthesized three layers:

> **[Layer 3 — EUREKA]** Every existing tool assumes you know the topic and type it in. Your approach is inverted: scrape trending topics first, then generate scripts from live data. That's not a script generator — that's a news pipeline with a script output. The hard part isn't getting Claude to write a good 20-second script. **The hard part is reliably pulling today's top AI stories from Hacker News + Reddit, deduplicating them, ranking by relevance, and formatting them into a consistent 8-script batch every morning.**

This reframing changed the entire architecture. The engineering challenge was the pipeline, not the prompts.

---

### Phase 3 — Adversarial spec review (3 rounds)

After writing the design doc, the agent dispatched an independent subagent to review it cold — no context from the session. **12 issues caught across 3 rounds:**

**Round 1 issues found:**
- No error handling for when fewer than 8 topics pass quality filtering
- HN API returns Unix timestamps, not hours — no conversion specified
- Module 2 had no word count guidance for Claude ("30-40 min video" ≠ a prompt instruction)
- `on_screen_actions` type was `string[]` but format was undefined
- Product Hunt API requires OAuth (not a free key as stated)
- Vercel default 10s timeout would be exceeded by the pipeline

**All fixed before a line of code was written.**

Final pipeline spec (excerpt from approved design doc):

```
1. Fetch HN top 30 IDs in parallel via Promise.all
   → recency_hours = (Date.now()/1000 - item.time) / 3600
2. Fetch Reddit r/artificial + r/MachineLearning + r/ChatGPT in parallel
3. Dedup: Jaccard similarity > 0.5 on word sets → keep higher-score item
4. Score: upvotes^0.5 × recency_hours^(-0.3) × ai_keyword_presence
   ai_keyword_presence = min(keyword_count_in_title, 3) / 3
5. If < 4 topics pass: return error "Not enough quality topics today"
6. Claude haiku → JSON array of 8 scripts with timing + on_screen_actions
```

---

### Phase 4 — Build (design doc → production in one pass)

With the spec locked, the agent built everything in sequence:

**File structure created:**
```
content-studio/
├── api/
│   ├── auth.ts              # Password validation + session token
│   ├── generate-scripts.ts  # Module 1: HN+Reddit pipeline → Claude
│   └── generate-outline.ts  # Module 2: Category → Claude deep-dive
├── src/
│   ├── types/index.ts       # TypeScript interfaces (Script, Outline, Session)
│   ├── lib/api.ts           # Fetch wrapper with session token injection
│   ├── lib/history.ts       # localStorage session management
│   ├── hooks/               # useScriptGeneration, useOutlineGeneration
│   ├── components/
│   │   ├── layout/Sidebar.tsx
│   │   └── module1/ScriptCard.tsx
│   └── pages/
│       ├── LoginPage.tsx    # Password gate
│       ├── Module1Page.tsx
│       ├── Module2Page.tsx
│       └── HistoryPage.tsx
├── vercel.json              # maxDuration: 30s (scripts), 60s (outlines)
└── dev-server.ts            # Local API proxy for Vite dev
```

**TypeScript check:** clean on first run  
**Build:** passing

---

### Phase 5 — Pipeline smoke test (before any UI)

The agent ran a live test of the data pipeline before building the UI — exactly as the design doc specified as the "gate":

```
HN fetched: 30 stories
Reddit fetched: 45 posts
After dedup: 74 unique topics

Top 8 topics for scripts:
  1. [r/ChatGPT] GPT Image 2 prompt that is viral right now... (score:3642, kw:33%)
  2. [r/ChatGPT] Asked ChatGPT to visualize a horizontal integral... (score:2517, kw:33%)
  3. [r/ChatGPT] GPT Image 2 has created this... (score:601, kw:33%)
  ...
✅ Pipeline works — enough topics found
```

Gate passed. UI built next.

---

### Phase 6 — Security layer + deployment

The agent added a password-protected auth system before pushing to GitHub:

- `/api/auth` validates password against `SITE_PASSWORD` env var, returns `SESSION_TOKEN`
- All API routes check `x-session-token` header — reject with 401 if missing/wrong
- Token stored in `localStorage`, injected into all fetch calls
- On 401 response: `clearToken()` + `window.location.reload()` → back to login screen
- `.env.local` confirmed gitignored before first commit

**GitHub push:**
```
gh repo create Proyectoscol/content-studio --public --push
→ https://github.com/Proyectoscol/content-studio
```

**Build failed on Vercel:** TypeScript 6.0 deprecation warning on `baseUrl` treated as error. Fixed in one line (`"ignoreDeprecations": "6.0"`). Redeployed.

**Env vars set via CLI (not dashboard):**
```bash
vercel env add ANTHROPIC_API_KEY production
vercel env add SESSION_TOKEN production
vercel env add SITE_PASSWORD production
# + 3 more
```

**Final deploy:** `https://content-studio-olive-delta.vercel.app`

---

## Key engineering decisions made during the session

| Decision | Reasoning |
|---|---|
| Vercel serverless, no Express | Express adds no value for 2 endpoints; serverless scales to zero and deploys cleanly |
| `maxDuration: 30s` on scripts, `60s` on outlines | HN parallel fetch (30 items) + Reddit (3 subreddits) + Claude call easily exceeds Vercel's 10s default |
| Claude haiku for Module 1, sonnet for Module 2 | Speed/cost matters for 8 scripts; quality/depth matters for a 40-min outline |
| Session token in `x-session-token` header, not cookie | Cookies require `SameSite`/`Secure` config on Vercel; custom header is simpler for a single-user tool |
| `localStorage` only, no database | Content is disposable after filming; session history is a nice-to-have, not a core requirement |
| Jaccard similarity for dedup, not embedding | Embeddings require an API call per title; Jaccard on word sets is O(n²) but fast enough for 75 items |
| `ai_keyword_presence = min(count, 3) / 3` | Clamped to [0,1]; prevents a single very-keyword-dense title from dominating; suggested by adversarial reviewer |

---

## What the agent caught that I would have missed

1. **Vercel timeout:** I had `maxDuration` in my head but didn't write it in the first spec. The adversarial reviewer flagged it as a day-1 stopper.
2. **HN Unix timestamps:** The scoring formula used `recency_hours` but the HN API returns `item.time` as Unix seconds since epoch — not hours. Would have produced `NaN` scores silently.
3. **Product Hunt OAuth:** I listed PH as a "free API." It requires OAuth app registration. Dropped from v1.
4. **The pipeline framing:** I came in thinking I was building a "script generator." The agent reframed it as a "data pipeline with script output." That changed which part I needed to build and test first.

---

## Second opinion (independent Claude subagent, cold read)

The agent dispatched a subagent with no context from the session to review the design. Key output:

> "This isn't a productivity tool. It's a **commitment device**. The user isn't slow — they're frozen. That means the prototype's job is to produce *one publishable output in under 5 minutes on day one*, or it fails psychologically before it fails technically."

This reframing survived into the final success criteria:
> *Module 1 produces 8 distinct, non-overlapping AI news scripts in under 5 minutes on day 1. Each script is filmable without editing.*

---

## Metrics

| Metric | Value |
|---|---|
| Time from idea to deployed production app | ~90 minutes |
| Files created | 19 source files |
| TypeScript errors on first check | 0 |
| Build failures | 1 (TS6 deprecation, fixed in 1 line) |
| Spec review rounds | 3 |
| Issues caught by adversarial reviewer | 12 |
| Issues fixed before shipping | 12 |
| Env vars set on Vercel | 6 |
| External API calls in Module 1 pipeline | ~33 (parallel) |

---

## Approved design doc (excerpt)

Full doc at: `~/.gstack/projects/Projects/camilocastillo-unknown-design-20260501-152538.md`

```markdown
# Design: Content Studio — AI Script & Video Content Generator
Status: APPROVED

## The Assignment
Create the project folder now. Run npm create vite@latest content-studio -- --template react-ts.
Get Module 1 producing one real script from HN data before building any UI.
That's the gate: if the pipeline doesn't work, nothing else matters.

## Success Criteria
- Module 1 produces 8 distinct, non-overlapping AI news scripts in under 5 minutes on day 1
- Each script is filmable without editing — timing matches 15-30 seconds, language is natural
- Module 2 produces a 30-40 minute video outline in under 3 minutes
- Outline can be pasted directly into Google Docs and is usable without reformatting
- App runs on Vercel with ANTHROPIC_API_KEY as the only required environment variable
```

---

*Session conducted with Claude Code (claude-sonnet-4-6) + gstack v1.25.0.0 on macOS, May 1 2026.*  
*Tools used: /office-hours (design), /gstack-upgrade (tool update), Claude subagent (adversarial review), gh CLI, Vercel CLI.*
