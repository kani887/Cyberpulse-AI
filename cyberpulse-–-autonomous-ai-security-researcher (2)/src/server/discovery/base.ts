import { DiscoveredTopic } from '../../types.js';

export interface TopicSource {
  name: string;
  fetch_topics(): Promise<DiscoveredTopic[]>;
}
