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
# VERCEL_ORG_ID                 — Team or user id from Vercel project settings
# VERCEL_PROJECT_ID             — Project id from Vercel project settings
#
# The deploy workflow syncs app secrets to Vercel production before each deploy.
#
# Add secrets: GitHub repo → Settings → Secrets and variables → Actions → New repository secret
