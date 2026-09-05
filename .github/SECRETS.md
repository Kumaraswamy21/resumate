# Required GitHub repository secrets
#
# App runtime (Next.js API routes)
# -------------------------------
# GOOGLE_GENERATIVE_AI_API_KEY  — Google AI Studio API key (required)
# AI_MODEL                      — Gemini model id (optional; defaults to gemini-2.0-flash)
#
# Vercel deployment (deploy workflow only)
# ----------------------------------------
# VERCEL_TOKEN                  — https://vercel.com/account/tokens
# VERCEL_ORG_ID                 — Project Settings → General → .vercel/project.json → orgId
# VERCEL_PROJECT_ID             — Project Settings → General → .vercel/project.json → projectId
#
# Find orgId / projectId: locally run `npx vercel link`, then copy values from `.vercel/project.json`.
# The token must belong to an account that can access that Vercel project.
#
# The deploy workflow links the project, syncs app secrets to Vercel production, then deploys.
#
# Add secrets: GitHub repo → Settings → Secrets and variables → Actions → New repository secret
