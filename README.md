# Resumate

ATS resume scoring for PDF and DOCX uploads. Extract text the way an applicant tracking system would, then get an AI compatibility score from 0–100.

## Getting Started

1. Copy environment variables:

```bash
cp .env.example .env.local
```

2. Set `GOOGLE_GENERATIVE_AI_API_KEY` in `.env.local` (get one from [Google AI Studio](https://aistudio.google.com/apikey)).

3. Install and run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Stack

- Next.js 14 App Router
- TypeScript (strict)
- Tailwind CSS
- Zod
- Vercel AI SDK (`ai`, `@ai-sdk/google`)

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run type-check` — `tsc --noEmit`
- `npm run lint` — ESLint
