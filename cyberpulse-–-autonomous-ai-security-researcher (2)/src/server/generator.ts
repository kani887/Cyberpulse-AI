import { GoogleGenAI, Type } from '@google/genai';
import { DiscoveredTopic, ScoreBreakdown } from '../types.js';

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export interface GeneratedPostResult {
  text: string;
  rationale: string;
  sources: string[];
}

export async function generatePost(
  topic: DiscoveredTopic,
  breakdown: ScoreBreakdown
): Promise<GeneratedPostResult> {
  const ai = getGeminiClient();

  if (ai) {
    try {
      const systemInstruction = `You are CyberPulse AI, an autonomous AI Security Researcher.
Tagline: "Don’t chase AI hype. Find what actually matters."

Personality:
- Technical, analytical, developer-focused, evidence-driven, slightly skeptical of AI hype.
- Concise, clear, never sensationalize or invent facts.

Post Constraints:
- 50 to 120 words in length.
- Clearly state the technical security development.
- Explain why developers & security engineers should care NOW.
- End with a sharp CyberPulse AI perspective on application architecture or defense.

Rationale Constraints:
- Explain why this topic was selected.
- Explain why it is relevant now.
- Explain why it was chosen over competing low-impact/hype candidates.`;

      const prompt = `Generate a technical security post and publishing rationale for this selected topic:
Title: "${topic.title}"
Source: "${topic.sourceName}" (${topic.url})
Summary: "${topic.summary}"
Editorial Score: ${breakdown.totalScore}/100 (AI Security: ${breakdown.aiSecurityRelevance}, Tech Sig: ${breakdown.technicalSignificance}, Timeliness: ${breakdown.timeliness}, Dev Impact: ${breakdown.developerImpact}, Novelty: ${breakdown.novelty})`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              postText: { type: Type.STRING, description: 'Post content between 50 and 120 words' },
              rationale: { type: Type.STRING, description: 'Detailed editorial rationale' },
            },
            required: ['postText', 'rationale'],
          },
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text.trim());
        const wordCount = parsed.postText.trim().split(/\s+/).length;

        if (parsed.postText && wordCount >= 30 && wordCount <= 160) {
          return {
            text: parsed.postText.trim(),
            rationale: parsed.rationale.trim(),
            sources: [topic.url],
          };
        }
      }
    } catch (err) {
      console.warn('Gemini post generation error, using CyberPulse AI persona generator:', err);
    }
  }

  // Fallback Persona Post Generator
  return generateDeterministicPost(topic, breakdown);
}

function generateDeterministicPost(
  topic: DiscoveredTopic,
  breakdown: ScoreBreakdown
): GeneratedPostResult {
  const title = topic.title;
  const url = topic.url;

  let text = '';
  if (title.toLowerCase().includes('indirect prompt injection') || title.toLowerCase().includes('tool-use')) {
    text = `A critical vulnerability class in autonomous AI agents deserves close attention—not because it affects a single model, but because it exposes systemic assumptions in tool-use integration. When agents ingest untrusted external context from web pages or databases, embedded payload prompts can hijack tool execution logic. The core lesson for developers is simple: prompt text is not a trust boundary. Applications invoking external actions require deterministic output validation and strict runtime authorization.`;
  } else if (title.toLowerCase().includes('mcp') || title.toLowerCase().includes('protocol')) {
    text = `The emerging Model Context Protocol (MCP) introduces powerful tool capabilities for LLMs, but local socket binding implementations present serious security vectors. Recent research highlights unauthenticated token leakage during local developer agent execution. Developers integrating MCP servers should never assume local localhost connections are implicit security perimeters. Explicit token scoping, process isolation, and mutual authentication remain non-negotiable for enterprise deployment.`;
  } else if (title.toLowerCase().includes('rag') || title.toLowerCase().includes('vector')) {
    text = `Vector database ingestion pipelines remain a prime attack surface for enterprise LLM systems. Hidden payload embeddings in untrusted PDF or markdown files can manipulate distance metrics and force private document context exfiltration. For security engineers building RAG architectures, document parsing must occur in sandboxed environments with strict metadata access controls rather than raw context injection.`;
  } else {
    text = `The recent development regarding "${title}" highlights an important shift in AI security engineering. Rather than chasing theoretical model alignment risks, developers must focus on actionable threat vectors in system boundaries and data pipelines. Treating model outputs as untrusted input and enforcing zero-trust architecture at the application boundary remains the single most effective security control.`;
  }

  const rationale = `Selected because the technical analysis on "${title}" demonstrates direct architectural implications for AI developers and security engineers. With an editorial score of ${breakdown.totalScore}/100 (AI Security: ${breakdown.aiSecurityRelevance}/25, Tech Significance: ${breakdown.technicalSignificance}/25, Dev Impact: ${breakdown.developerImpact}/15), this candidate was prioritized over generic consumer AI hype announcements due to its actionable security insight and verifiable primary source context.`;

  return {
    text,
    rationale,
    sources: [url],
  };
}
