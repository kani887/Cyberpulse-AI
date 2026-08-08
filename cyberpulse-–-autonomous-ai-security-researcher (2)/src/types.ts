export interface Persona {
  name: string;
  domain: string;
  tagline?: string;
}

export interface AgentInitRequest {
  persona: Persona;
}

export interface AgentInitResponse {
  agentId: string;
}

export interface Post {
  id: string;
  createdAt: string; // ISO-8601-UTC
  text: string;
  rationale: string;
  sources: string[];
  topicTitle?: string;
  score?: number;
  scoreBreakdown?: ScoreBreakdown;
}

export interface FeedResponse {
  posts: Post[];
}

export interface ScoreBreakdown {
  aiSecurityRelevance: number; // 0-25
  technicalSignificance: number; // 0-25
  timeliness: number; // 0-20
  developerImpact: number; // 0-15
  novelty: number; // 0-15
  totalScore: number; // 0-100
}

export interface DiscoveredTopic {
  id: string;
  title: string;
  url: string;
  summary: string;
  publishedAt: string;
  sourceName: string;
}

export interface TopicEvaluation {
  topic: DiscoveredTopic;
  breakdown: ScoreBreakdown;
  decision: 'ACCEPTED' | 'REJECTED';
  rationale: string;
  rejectionReason?: string;
}

export interface AgentStats {
  agentId: string;
  personaName: string;
  domain: string;
  status: 'running' | 'idle' | 'stopped';
  totalPosts: number;
  topicsDiscovered: number;
  topicsRejected: number;
  topicsPublished: number;
  lastRunAt: string | null;
  nextRunAt: string | null;
  autonomyIntervalSeconds: number;
}

export interface RejectedTopic {
  id: string;
  title: string;
  url: string;
  sourceName: string;
  discoveredAt: string;
  score: number;
  rejectionReason: string;
}
