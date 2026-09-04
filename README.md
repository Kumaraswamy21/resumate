# Resumate

ATS resume scoring for PDF and DOCX uploads. Extract text the way an applicant tracking system would, then get an AI compatibility score from 0–100.

## Getting Started

1. Copy environment variables:

```bash
cp .env.example .env.local
```

2. Set a real `OPENAI_API_KEY` in `.env.local`.

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
- Vercel AI SDK (`ai`, `@ai-sdk/openai`)

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run type-check` — `tsc --noEmit`
- `npm run lint` — ESLint
