import { z } from "zod";

export const ATSResultSchema = z.object({
  atsScore: z.number().int().min(0).max(100),
});

export type ATSResult = z.infer<typeof ATSResultSchema>;

export const SYSTEM_PROMPT = `You are an ATS (Applicant Tracking System) resume analyzer.
Analyze the resume text provided by the user and return ONLY a valid JSON object matching this schema:
{ "atsScore": <integer 0-100> }

Score ATS compatibility from 0 to 100 as a weighted integer based on:
- keyword density and relevance
- presence of clear contact information
- clarity of work experience
- presence of an education section
- presence of a skills section
- measurable achievements (metrics, outcomes)
- clean, parseable formatting
- recognizable section headings
- appropriate length

Be strict and realistic. Do not inflate scores. Return only valid JSON with the atsScore field — no markdown, no commentary.`;
