# 👻 GhostLink — Full Project Plan
> One link. Infinite experiences. AI-powered adaptive content delivery.

---

## 🧠 What Is GhostLink?

GhostLink is a web app where you create **one shareable URL** that delivers a **completely different experience** to every person who opens it — based on passive browser signals (device, timezone, time of day, referrer, language, screen size, mouse behavior). No login required from the visitor. No forms. Pure magic.

**The killer demo moment:** Open the same GhostLink on two different phones. Two completely different pages appear. Judges go silent.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                │
│                                                      │
│  /              → Landing + Link Creator             │
│  /create        → Content input + customization      │
│  /dashboard     → Your links + analytics             │
│  /g/[slug]      → GhostLink delivery page            │
└──────────────────────────┬──────────────────────────┘
                           │ API calls
┌──────────────────────────▼──────────────────────────┐
│                  API ROUTES (Next.js)                │
│                                                      │
│  POST /api/create     → Save link + content          │
│  POST /api/resolve    → AI personalizes content      │
│  GET  /api/links      → Fetch user's links           │
│  GET  /api/analytics  → View signal logs             │
└──────────────────────────┬──────────────────────────┘
                           │
          ┌────────────────┴────────────────┐
          │                                 │
┌─────────▼──────────┐           ┌──────────▼─────────┐
│   OpenRouter API   │           │   Vercel KV Store  │
│                    │           │   (free, built-in) │
│  Model: free tier  │           │                    │
│  (mistral/llama)   │           │  Stores: links,    │
│                    │           │  content variants, │
│  Personalizes      │           │  signal logs       │
│  content based     │           │                    │
│  on signals        │           └────────────────────┘
└────────────────────┘
```

---

## 📦 Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | Next.js 14 (App Router) | Fast, free on Vercel, API routes built in |
| Styling | Tailwind CSS | Rapid UI, hackathon speed |
| Database | Vercel KV (Redis) | Free, instant, no setup |
| AI | OpenRouter API | Free models (Mistral, LLaMA) |
| Hosting | Vercel | Free, auto-deploy from GitHub, zero cold starts |
| Short URLs | Nanoid (npm) | Generate unique slugs |

---

## 🗂️ Folder Structure

```
ghostlink/
├── app/
│   ├── page.tsx                  # Landing page
│   ├── create/
│   │   └── page.tsx              # Link creator
│   ├── dashboard/
│   │   └── page.tsx              # Your links
│   └── g/
│       └── [slug]/
│           └── page.tsx          # GhostLink delivery
├── api/
│   ├── create/route.ts           # Save new link
│   ├── resolve/route.ts          # AI personalization
│   └── analytics/route.ts        # Signal logs
├── components/
│   ├── SignalCollector.tsx        # Collects browser signals
│   ├── LinkCard.tsx              # Link preview card
│   ├── ContentRenderer.tsx       # Renders AI response
│   └── CopyButton.tsx            # Copy link to clipboard
├── lib/
│   ├── openrouter.ts             # OpenRouter API wrapper
│   ├── signals.ts                # Signal collection logic
│   ├── kv.ts                     # Vercel KV helpers
│   └── slugify.ts                # Nanoid slug generator
├── types/
│   └── index.ts                  # Shared TypeScript types
├── .env.local                    # API keys (never commit)
└── vercel.json                   # Vercel config
```

---

## 🔌 Signal Collection System

These are the **passive signals** collected the moment someone opens a GhostLink. No permissions needed. All freely available from the browser:

```typescript
// lib/signals.ts

export interface BrowserSignals {
  timezone: string;           // e.g. "Asia/Kolkata"
  language: string;           // e.g. "en-IN"
  deviceType: string;         // "mobile" | "tablet" | "desktop"
  screenSize: string;         // "small" | "medium" | "large"
  timeOfDay: string;          // "morning" | "afternoon" | "evening" | "night"
  dayOfWeek: string;          // "weekday" | "weekend"
  referrer: string;           // "linkedin" | "whatsapp" | "twitter" | "direct" | "other"
  colorScheme: string;        // "dark" | "light" (system preference)
  connectionSpeed: string;    // "slow" | "fast"
  mouseSpeed: string;         // "slow" | "fast" (anxiety signal)
  platform: string;           // "windows" | "mac" | "linux" | "ios" | "android"
}
```

---

## 🤖 AI Personalization Logic

The collected signals are sent to OpenRouter with the user's original content. The AI returns a **personalized version** of that content tailored to the visitor's inferred personality.

```typescript
// lib/openrouter.ts

const systemPrompt = `
You are a content personalization engine.
You receive:
1. Original content (portfolio, message, product page, etc.)
2. Browser signals about the visitor

Your job: Rewrite or restructure the content to feel perfectly tailored
to this specific visitor. Change tone, emphasis, order of sections,
and language — but never change the facts.

Return ONLY valid JSON in this format:
{
  "title": "...",
  "headline": "...",
  "body": "...",
  "cta": "...",
  "tone": "professional | casual | playful | urgent"
}
`
```

**Example transformation:**
- Recruiter from LinkedIn at 10am → formal tone, achievements first, clean CTA
- Friend from WhatsApp at midnight → casual tone, fun facts first, emoji CTA
- Developer from GitHub → technical stack first, GitHub links prominent

---

## 🗃️ Data Models

```typescript
// types/index.ts

export interface GhostLink {
  id: string;                    // nanoid slug e.g. "x7k2p"
  createdAt: string;             // ISO timestamp
  originalContent: {
    title: string;
    body: string;
    cta?: string;
    ctaUrl?: string;
    imageUrl?: string;
  };
  visits: number;
  signals: SignalLog[];           // array of all past visits
}

export interface SignalLog {
  timestamp: string;
  signals: BrowserSignals;
  aiPersonality: string;         // what the AI decided about this visitor
  toneServed: string;            // which tone was used
}
```

---

## 🚀 Phases & Timeline (10 Hours)

---

### ✅ Phase 0 — Setup (30 min)
**Goal:** Project running locally and on Vercel

- [ ] `npx create-next-app@latest ghostlink --typescript --tailwind --app`
- [ ] Install dependencies: `nanoid`, `@vercel/kv`
- [ ] Create `.env.local` with `OPENROUTER_API_KEY`
- [ ] Push to GitHub
- [ ] Connect repo to Vercel (auto-deploy on every push)
- [ ] Enable Vercel KV from Vercel dashboard (free)

**Env variables needed:**
```
OPENROUTER_API_KEY=your_key_here
KV_REST_API_URL=from_vercel_dashboard
KV_REST_API_TOKEN=from_vercel_dashboard
```

---

### ✅ Phase 1 — Landing Page (1 hour)
**Goal:** Beautiful, impressive first impression

**Page: `app/page.tsx`**
- Hero: "One link. A different experience for everyone."
- Animated tagline showing different personas (recruiter / friend / developer)
- Big CTA button → `/create`
- How it works section (3 steps)
- Footer

**Design direction:** Dark theme, glowing ghost emoji motif, subtle animated background

---

### ✅ Phase 2 — Link Creator (1.5 hours)
**Goal:** User inputs their content and gets a GhostLink

**Page: `app/create/page.tsx`**

Form fields:
```
Title of your content        [text input]
Main body / description      [textarea]
Call to action text          [text input, optional]
Call to action URL           [text input, optional]
```

On submit:
1. POST to `/api/create`
2. API generates nanoid slug
3. Saves to Vercel KV
4. Returns `ghostlink.app/g/[slug]`
5. Show success screen with copy button + QR code

**API: `api/create/route.ts`**
```typescript
POST /api/create
Body: { title, body, cta, ctaUrl }
Returns: { slug, url }
```

---

### ✅ Phase 3 — Signal Collector (1.5 hours)
**Goal:** Silently collect all browser signals when someone opens a GhostLink

**Component: `components/SignalCollector.tsx`**

This runs client-side the moment `/g/[slug]` loads:

```typescript
// Collect all signals instantly
const signals = {
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  language: navigator.language,
  deviceType: getDeviceType(),          // from userAgent
  screenSize: getScreenSize(),          // from window.innerWidth
  timeOfDay: getTimeOfDay(),            // from new Date().getHours()
  dayOfWeek: getDayOfWeek(),            // weekday vs weekend
  referrer: parseReferrer(document.referrer),
  colorScheme: getColorScheme(),        // prefers-color-scheme
  connectionSpeed: getConnectionSpeed(), // navigator.connection
  platform: getPlatform(),              // from userAgent
}

// Immediately POST to /api/resolve with signals + slug
```

---

### ✅ Phase 4 — AI Resolution Engine (2 hours)
**Goal:** Take signals → call OpenRouter → return personalized content

**API: `api/resolve/route.ts`**

```typescript
POST /api/resolve
Body: { slug, signals }

Steps:
1. Fetch original content from KV using slug
2. Build prompt with signals + original content
3. Call OpenRouter (free model: mistral-7b or llama-3)
4. Parse JSON response
5. Log signal + response back to KV
6. Return personalized content to client
```

**OpenRouter call:**
```typescript
const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    model: "mistralai/mistral-7b-instruct:free",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: JSON.stringify({ content: originalContent, signals }) }
    ]
  })
})
```

---

### ✅ Phase 5 — GhostLink Delivery Page (1.5 hours)
**Goal:** The page visitors see — renders personalized content beautifully

**Page: `app/g/[slug]/page.tsx`**

Flow:
1. Page loads → shows subtle loading animation ("Preparing your experience...")
2. `SignalCollector` runs silently
3. POST to `/api/resolve`
4. Render personalized content with smooth fade-in
5. Show CTA button if provided

**Content renderer shows:**
- Personalized headline
- Personalized body
- CTA button (if provided)
- Subtle "Made with GhostLink" footer

**Loading state:** Ghost emoji pulsing, "Reading the room..." text

---

### ✅ Phase 6 — Dashboard (1 hour)
**Goal:** See all your GhostLinks + basic analytics

**Page: `app/dashboard/page.tsx`**

Shows per link:
- URL + copy button
- Total visits
- Last 5 signal logs (what type of person visited)
- AI personality labels ("Professional", "Casual Browser", "Night Owl", etc.)

This is your **wow factor for judges** — showing that the same link served 5 completely different experiences to 5 different people.

---

### ✅ Phase 7 — Polish + Demo Prep (1 hour)
**Goal:** Make it look and feel production-ready for the demo

- [ ] Add loading skeletons everywhere
- [ ] Add toast notifications (link copied, link created)
- [ ] Add QR code generation for each GhostLink (use `qrcode.react`)
- [ ] Mobile responsiveness check
- [ ] Test with 2 different devices/browsers simultaneously
- [ ] Prepare demo script (show same link on two phones)
- [ ] Record a backup demo video in case of internet issues

---

## 🎯 Demo Script (Hackathon Presentation)

```
1. Open ghostlink.app
2. "I'm going to create one link right now"
3. Paste a portfolio/product description → Generate link
4. "Now watch what happens when different people open it"
5. Open on your laptop (desktop, daytime, direct)
6. Open on phone (mobile, different timezone)
7. Both show DIFFERENT content from same URL
8. Show dashboard → "Here's what GhostLink learned about each visitor"
9. "Same link. Zero effort. Perfectly personalized. Every time."
```

---

## ⚠️ Edge Cases to Handle

| Case | Solution |
|---|---|
| OpenRouter API slow | Show "Reading the room..." animation, 10s timeout fallback to original content |
| Invalid slug | Redirect to homepage with friendly error |
| KV store miss | Graceful "Link not found" page |
| No referrer | Default to "direct" category |
| Ad blocker blocking signals | Collect what's available, skip rest |
| Mobile no mouse | Skip mouse speed signal |

---

## 🔑 Environment Variables

```bash
# .env.local — NEVER commit this file

OPENROUTER_API_KEY=sk-or-...        # From openrouter.ai
KV_REST_API_URL=https://...         # From Vercel KV dashboard
KV_REST_API_TOKEN=...               # From Vercel KV dashboard
NEXT_PUBLIC_BASE_URL=https://ghostlink.vercel.app
```

---

## 📦 Dependencies to Install

```bash
npm install nanoid @vercel/kv qrcode.react
npm install -D @types/node
```

---

## 🏆 Why This Wins

| Criteria | GhostLink |
|---|---|
| **Originality** | Never been done cleanly as a web product |
| **Demo-ability** | Live two-phone demo is jaw-dropping |
| **Technical depth** | Signal collection + AI + KV + Next.js |
| **Real use case** | Portfolios, marketing, pranks, gifts |
| **Polish** | Deployable, shareable, production-ready |
| **Free to run** | Vercel free + OpenRouter free models |

---

## 🧱 Copilot Instructions

> When implementing this project, follow these rules strictly:

1. **Always use App Router** — no `pages/` directory
2. **All API routes** are in `app/api/*/route.ts` format
3. **Signal collection** is always client-side only (use `"use client"`)
4. **AI calls** are always server-side only (API routes, never expose key)
5. **KV operations** are always in API routes, never client-side
6. **TypeScript strict mode** — no `any` types
7. **Error handling** on every API call — always have a fallback
8. **OpenRouter model** to use: `mistralai/mistral-7b-instruct:free`
9. **JSON response** from AI must be validated before rendering
10. **Loading states** on every async operation — never show blank screen