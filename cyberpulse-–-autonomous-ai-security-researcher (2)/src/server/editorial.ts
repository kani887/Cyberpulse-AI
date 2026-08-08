import { GoogleGenAI, Type } from '@google/genai';
import { DiscoveredTopic, ScoreBreakdown, TopicEvaluation } from '../types.js';

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

export async function evaluateTopic(
  topic: DiscoveredTopic,
  isDuplicate: boolean
): Promise<TopicEvaluation> {
  if (isDuplicate) {
    return {
      topic,
      breakdown: {
        aiSecurityRelevance: 10,
        technicalSignificance: 10,
        timeliness: 5,
        developerImpact: 5,
        novelty: 0,
        totalScore: 30,
      },
      decision: 'REJECTED',
      rationale: 'Topic rejected because a similar development was already published in memory.',
      rejectionReason: 'Duplicate topic or previously published content.',
    };
  }

  const ai = getGeminiClient();

  if (ai) {
    try {
      const prompt = `You are the editorial evaluator for CyberPulse AI, an autonomous AI Security Researcher.
Evaluate the following discovered topic according to strict editorial principles:

Editorial Criteria & Point Maxima:
- AI Security Relevance (0-25): Is it directly related to AI, LLM vulnerabilities, prompt injection, model security, or AI safety?
- Technical Significance (0-25): Is there real engineering substance, vulnerability analysis, or research methodology?
- Timeliness (0-20): Is this relevant right now for modern AI development?
- Developer Impact (0-15): Does this provide actionable insight for developers and security engineers?
- Novelty (0-15): Is it a fresh insight or new technical technique?
You are the editorial evaluator for CyberPulse AI, an autonomous AI security researcher.

Evaluate the discovered topic strictly for technical quality and usefulness to AI developers and security engineers.

Editorial Criteria & Point Maxima:
- AI Security Relevance (0-25): Directly related to AI security, LLM security, agent security, prompt injection, model vulnerabilities, AI supply-chain security, data leakage, or AI infrastructure security.
- Technical Significance (0-25): Contains real technical substance, engineering implications, vulnerability analysis, research findings, or meaningful security mechanisms.
- Timeliness (0-20): Relevant to current AI development and recent security research.
- Developer Impact (0-15): Provides practical and actionable insight for developers or security engineers.
- Novelty (0-15): Fresh research, new vulnerability, new technique, new finding, or a meaningful new perspective.

IMPORTANT QUALITY RULES:
1. Prefer recent security research, CVEs, advisories, papers, technical reports, and real-world incidents.
2. Reject generic AI news, product announcements, marketing content, opinion-only posts, and repetitive topics.
3. Do not reward a topic merely because it contains the words "AI", "LLM", or "security".
4. Give high scores only when the source contains concrete technical evidence.
5. Prefer topics with clear developer/security engineering implications.
6. Prefer genuinely new findings over repeated coverage of old topics.
7. Avoid duplicate or substantially similar topics already stored in memory.
8. A topic should normally score 75+ to be ACCEPTED.

Scoring guidance:
- 90-100 = exceptional, highly technical and novel
- 80-89 = strong and publishable
- 75-79 = acceptable if technically useful
- Below 75 = reject

Topic Title: ${topic.title}
Source: ${topic.sourceName}
Summary: ${topic.summary}

Evaluate the topic and return JSON only.

If totalScore >= 75, decision must be "ACCEPTED".
If totalScore < 75, decision must be "REJECTED".

For rejected topics, provide a specific rejectionReason explaining which quality criterion was weak.
Topic Title: "${topic.title}"
Source: "${topic.sourceName}"
Summary: "${topic.summary}"

Evaluate the topic and output JSON conforming strictly to the requested schema. If totalScore < 75 or it's marketing hype, set decision to "REJECTED".`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              aiSecurityRelevance: { type: Type.INTEGER, description: 'Score 0 to 25' },
              technicalSignificance: { type: Type.INTEGER, description: 'Score 0 to 25' },
              timeliness: { type: Type.INTEGER, description: 'Score 0 to 20' },
              developerImpact: { type: Type.INTEGER, description: 'Score 0 to 15' },
              novelty: { type: Type.INTEGER, description: 'Score 0 to 15' },
              totalScore: { type: Type.INTEGER, description: 'Sum of the scores 0-100' },
              decision: { type: Type.STRING, description: 'ACCEPTED or REJECTED' },
              rationale: { type: Type.STRING, description: 'Explanation of evaluation' },
              rejectionReason: { type: Type.STRING, description: 'Detailed reason if rejected' },
            },
            required: ['aiSecurityRelevance', 'technicalSignificance', 'timeliness', 'developerImpact', 'novelty', 'totalScore', 'decision', 'rationale'],
          },
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text.trim());
        const totalScore = (parsed.aiSecurityRelevance || 0) +
          (parsed.technicalSignificance || 0) +
          (parsed.timeliness || 0) +
          (parsed.developerImpact || 0) +
          (parsed.novelty || 0);

        const decision = totalScore >= 65 && parsed.decision !== 'REJECTED' ? 'ACCEPTED' : 'REJECTED';

        return {
          topic,
          breakdown: {
            aiSecurityRelevance: parsed.aiSecurityRelevance || 0,
            technicalSignificance: parsed.technicalSignificance || 0,
            timeliness: parsed.timeliness || 0,
            developerImpact: parsed.developerImpact || 0,
            novelty: parsed.novelty || 0,
            totalScore,
          },
          decision,
          rationale: parsed.rationale || 'Evaluated by CyberPulse AI Editorial AI.',
          rejectionReason: decision === 'REJECTED' ? (parsed.rejectionReason || `Score ${totalScore}/100 is below the 65 editorial publication threshold.`) : undefined,
        };
      }
    } catch (err) {
      console.warn('Gemini editorial evaluation error, falling back to heuristic evaluation:', err);
    }
  }

  // Fallback Heuristic Editorial Evaluator
  return evaluateHeuristically(topic);
}

function evaluateHeuristically(topic: DiscoveredTopic): TopicEvaluation {
  const text = (topic.title + ' ' + topic.summary).toLowerCase();

  // Negative marketing / hype indicators
  const hypeKeywords = ['claim 100%', 'unbreakable', 'magic algorithms', 'hype', 'press release', 'consumer wrapper', 'superintelligence'];
  const isHype = hypeKeywords.some(kw => text.includes(kw));

  // High relevance keywords
  const secKeywords = ['prompt injection', 'vulnerability', 'mcp', 'jailbreak', 'cve', 'owasp', 'poison', 'cisa', 'agent', 'advisory', 'attack', 'vector', 'model context protocol', 'rag', 'side-channel', 'quantized'];
  const matchesSec = secKeywords.filter(kw => text.includes(kw)).length;

  if (isHype) {
    return {
      topic,
      breakdown: {
        aiSecurityRelevance: 5,
        technicalSignificance: 5,
        timeliness: 10,
        developerImpact: 5,
        novelty: 5,
        totalScore: 30,
      },
      decision: 'REJECTED',
      rationale: 'Rejected due to marketing hype and lack of verifiable technical evidence.',
      rejectionReason: 'Pure marketing/hype without technical depth or verified claims.',
    };
  }

  let aiRel = 15;
  let techSig = 15;
  let time = 15;
  let devImp = 10;
  let nov = 10;

  if (matchesSec >= 2) {
    aiRel = 23;
    techSig = 22;
    time = 18;
    devImp = 14;
    nov = 13;
  } else if (matchesSec === 1) {
    aiRel = 18;
    techSig = 16;
    time = 15;
    devImp = 11;
    nov = 10;
  } else {
    aiRel = 8;
    techSig = 8;
    time = 10;
    devImp = 5;
    nov = 5;
  }

  const totalScore = aiRel + techSig + time + devImp + nov;
  const decision = totalScore >= 65 ? 'ACCEPTED' : 'REJECTED';

  return {
    topic,
    breakdown: {
      aiSecurityRelevance: aiRel,
      technicalSignificance: techSig,
      timeliness: time,
      developerImpact: devImp,
      novelty: nov,
      totalScore,
    },
    decision,
    rationale: decision === 'ACCEPTED'
      ? `Selected due to high technical relevance (${matchesSec} key AI security vectors identified) and immediate developer impact.`
      : `Rejected because total editorial score (${totalScore}/100) is below the 65 publication threshold.`,
    rejectionReason: decision === 'REJECTED' ? `Total score ${totalScore}/100 does not meet CyberPulse AI's 65-point publication requirement.` : undefined,
  };
}
 