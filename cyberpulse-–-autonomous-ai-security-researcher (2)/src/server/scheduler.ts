import { getAllSources } from './discovery/sources.js';
import { evaluateTopic } from './editorial.js';
import { generatePost } from './generator.ts';
import { checkMemoryForTopic } from './memory.js';
import {
  saveDiscoveredTopic,
  savePost,
  getPostsForAgent,
  getFirstAgentId,
  createOrUpdateAgent,
  saveDbToDisk
} from './database.js';

let isRunningCycle = false;
let schedulerTimer: NodeJS.Timeout | null = null;
let lastRunTime: string | null = null;
let nextRunTime: string | null = null;

export function getAutonomyInterval(): number {
  const envVal = process.env.AUTONOMY_INTERVAL_SECONDS;
  if (envVal) {
    const parsed = parseInt(envVal, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return 180; // Default 3 minutes
}

export function getSchedulerState() {
  return {
    lastRunAt: lastRunTime,
    nextRunAt: nextRunTime,
    intervalSeconds: getAutonomyInterval(),
    isCycleActive: isRunningCycle,
  };
}

export async function runResearchCycle(agentIdParam?: string): Promise<{
  discoveredCount: number;
  acceptedCount: number;
  rejectedCount: number;
}> {
  if (isRunningCycle) {
    console.log('[Scheduler] Cycle already in progress, skipping overlapping execution.');
    return { discoveredCount: 0, acceptedCount: 0, rejectedCount: 0 };
  }

  isRunningCycle = true;
  lastRunTime = new Date().toISOString();
  const intervalSec = getAutonomyInterval();
  nextRunTime = new Date(Date.now() + intervalSec * 1000).toISOString();

  let discoveredCount = 0;
  let acceptedCount = 0;
  let rejectedCount = 0;

  try {
    const agentId = agentIdParam || (await getFirstAgentId()) || 'cyberpulse-main';
    console.log(`[CyberPulse AI] Starting autonomous research cycle for agent: ${agentId}`);

    // Ensure agent exists in database
    await createOrUpdateAgent(agentId, 'CyberPulse AI', 'AI Security');

    // Step 1: Discover topics across all live sources
    const sources = getAllSources();
    const discoveredCandidates = [];

    for (const source of sources) {
      try {
        const topics = await source.fetch_topics();
        discoveredCandidates.push(...topics);
      } catch (err) {
        console.warn(`[Scheduler] Source ${source.name} failed during cycle:`, err);
      }
    }

    discoveredCount = discoveredCandidates.length;
    console.log(`[CyberPulse AI] Discovered ${discoveredCount} topics across sources.`);

    // Step 2 & 3: Filter & Evaluate candidate topics
    let publishedInThisCycle = false;

    for (const candidate of discoveredCandidates) {
      // Check memory for exact or similar publication
      const memoryCheck = await checkMemoryForTopic(candidate.url, candidate.title);

      // Evaluate topic using Editorial Judgement (Gemini or heuristic)
      const evaluation = await evaluateTopic(candidate, memoryCheck.isDuplicate);

      // Step 4: Store evaluation in topics table (including rejections)
      await saveDiscoveredTopic({
        id: candidate.id,
        title: candidate.title,
        url: candidate.url,
        summary: candidate.summary,
        discoveredAt: candidate.publishedAt || new Date().toISOString(),
        score: evaluation.breakdown.totalScore,
        aiRelevance: evaluation.breakdown.aiSecurityRelevance,
        techSignificance: evaluation.breakdown.technicalSignificance,
        timeliness: evaluation.breakdown.timeliness,
        devImpact: evaluation.breakdown.developerImpact,
        novelty: evaluation.breakdown.novelty,
        decision: evaluation.decision,
        rejectionReason: evaluation.rejectionReason,
        sourceName: candidate.sourceName,
      });

      if (evaluation.decision === 'REJECTED') {
        rejectedCount++;
      } else if (evaluation.decision === 'ACCEPTED') {
        acceptedCount++;

        // Step 5: Post Generation & Validation
        // If we haven't published a post in this cycle, generate and publish it!
        if (!publishedInThisCycle) {
          console.log(`[CyberPulse AI] Topic ACCEPTED (Score: ${evaluation.breakdown.totalScore}/100): "${candidate.title}". Generating post...`);

          const generated = await generatePost(candidate, evaluation.breakdown);

          // Validation
          if (
            generated.text &&
            generated.text.length > 20 &&
            generated.sources.length > 0 &&
            generated.rationale
          ) {
            const postId = `post-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
            const postCreatedAt = new Date().toISOString();

            await savePost({
              id: postId,
              agentId,
              topicId: candidate.id,
              topicTitle: candidate.title,
              text: generated.text,
              rationale: generated.rationale,
              score: evaluation.breakdown.totalScore,
              createdAt: postCreatedAt,
              sources: generated.sources,
            });

            publishedInThisCycle = true;
            console.log(`[CyberPulse AI] Successfully published post ${postId} for topic: "${candidate.title}"`);
          } else {
            console.warn(`[CyberPulse AI] Validation failed for post generation on topic: "${candidate.title}"`);
          }
        }
      }
    }

    // If no candidate was accepted/published in this cycle, ensure we have at least one post if DB is empty
    const existingPosts = await getPostsForAgent(agentId);
    if (existingPosts.length === 0 && discoveredCandidates.length > 0) {
      const topTopic = discoveredCandidates[0];
      const fallbackEval = await evaluateTopic(topTopic, false);
      const generated = await generatePost(topTopic, fallbackEval.breakdown);

      const postId = `post-init-${Date.now()}`;
      await savePost({
        id: postId,
        agentId,
        topicId: topTopic.id,
        topicTitle: topTopic.title,
        text: generated.text,
        rationale: generated.rationale,
        score: Math.max(fallbackEval.breakdown.totalScore, 75),
        createdAt: new Date().toISOString(),
        sources: [topTopic.url],
      });
      console.log(`[CyberPulse AI] Bootstrapped initial post ${postId}`);
    }

    saveDbToDisk();
  } catch (err) {
    console.error('[Scheduler] Error during research cycle:', err);
  } finally {
    isRunningCycle = false;
  }

  return { discoveredCount, acceptedCount, rejectedCount };
}

export function startAutonomousScheduler(agentId?: string) {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
  }

  const intervalSec = getAutonomyInterval();
  console.log(`[CyberPulse AI] Starting autonomous background scheduler (Interval: ${intervalSec}s)...`);

  // Run immediate first cycle in background
  setTimeout(() => {
    runResearchCycle(agentId).catch((err) =>
      console.error('[Scheduler] First run error:', err)
    );
  }, 1000);

  // Set recurring loop
  schedulerTimer = setInterval(() => {
    runResearchCycle(agentId).catch((err) =>
      console.error('[Scheduler] Recurring run error:', err)
    );
  }, intervalSec * 1000);

  nextRunTime = new Date(Date.now() + intervalSec * 1000).toISOString();
}
