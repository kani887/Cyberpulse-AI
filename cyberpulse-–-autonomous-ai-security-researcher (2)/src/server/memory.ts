import { isTopicAlreadyProcessed, isSimilarTopicPublished } from './database.js';

export async function checkMemoryForTopic(url: string, title: string): Promise<{
  isDuplicate: boolean;
  reason?: string;
}> {
  const processed = await isTopicAlreadyProcessed(url, title);
  if (processed) {
    return {
      isDuplicate: true,
      reason: 'Exact URL or topic title already processed in memory.',
    };
  }

  const similar = await isSimilarTopicPublished(title);
  if (similar) {
    return {
      isDuplicate: true,
      reason: 'Highly similar topic has already been published in recent memory.',
    };
  }

  return { isDuplicate: false };
}
