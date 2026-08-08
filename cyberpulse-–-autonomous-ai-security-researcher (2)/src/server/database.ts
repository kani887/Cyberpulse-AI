import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { Post, RejectedTopic, AgentStats } from '../types.js';

let dbInstance: Database | null = null;
const DB_FILE_PATH = path.join(process.cwd(), 'data.sqlite');

export async function getDb(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_FILE_PATH)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE_PATH);
      dbInstance = new SQL.Database(fileBuffer);
    } catch (err) {
      console.warn('Failed to load existing data.sqlite, creating new DB:', err);
      dbInstance = new SQL.Database();
    }
  } else {
    dbInstance = new SQL.Database();
  }

  initTables(dbInstance);
  saveDbToDisk();
  return dbInstance;
}

export function saveDbToDisk() {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE_PATH, buffer);
  } catch (err) {
    console.error('Error saving SQLite DB to disk:', err);
  }
}

function initTables(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      domain TEXT NOT NULL,
      created_at TEXT NOT NULL,
      status TEXT NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS topics (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      summary TEXT,
      discovered_at TEXT NOT NULL,
      score INTEGER NOT NULL,
      ai_relevance INTEGER DEFAULT 0,
      tech_significance INTEGER DEFAULT 0,
      timeliness INTEGER DEFAULT 0,
      dev_impact INTEGER DEFAULT 0,
      novelty INTEGER DEFAULT 0,
      decision TEXT NOT NULL,
      rejection_reason TEXT,
      source_name TEXT
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL,
      topic_id TEXT,
      topic_title TEXT,
      text TEXT NOT NULL,
      rationale TEXT NOT NULL,
      score INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (agent_id) REFERENCES agents(id)
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS post_sources (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL,
      source_url TEXT NOT NULL,
      FOREIGN KEY (post_id) REFERENCES posts(id)
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS memory (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL,
      topic TEXT NOT NULL,
      summary TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (agent_id) REFERENCES agents(id)
    );
  `);
}

// Helper query wrappers for sql.js

export async function createOrUpdateAgent(id: string, name: string, domain: string) {
  const db = await getDb();
  const now = new Date().toISOString();
  
  db.run(
    `INSERT INTO agents (id, name, domain, created_at, status)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET name=?, domain=?, status=?`,
    [id, name, domain, now, 'running', name, domain, 'running']
  );
  saveDbToDisk();
}

export async function getAgent(id: string) {
  const db = await getDb();
  const stmt = db.prepare(`SELECT * FROM agents WHERE id = ?`);
  stmt.bind([id]);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
}

export async function getFirstAgentId(): Promise<string | null> {
  const db = await getDb();
  const stmt = db.prepare(`SELECT id FROM agents ORDER BY created_at ASC LIMIT 1`);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row.id as string;
  }
  stmt.free();
  return null;
}

export async function saveDiscoveredTopic(topic: {
  id: string;
  title: string;
  url: string;
  summary: string;
  discoveredAt: string;
  score: number;
  aiRelevance: number;
  techSignificance: number;
  timeliness: number;
  devImpact: number;
  novelty: number;
  decision: 'ACCEPTED' | 'REJECTED';
  rejectionReason?: string;
  sourceName: string;
}) {
  const db = await getDb();
  db.run(
    `INSERT INTO topics (
      id, title, url, summary, discovered_at, score,
      ai_relevance, tech_significance, timeliness, dev_impact, novelty,
      decision, rejection_reason, source_name
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      score=?, decision=?, rejection_reason=?`,
    [
      topic.id,
      topic.title,
      topic.url,
      topic.summary,
      topic.discoveredAt,
      topic.score,
      topic.aiRelevance,
      topic.techSignificance,
      topic.timeliness,
      topic.devImpact,
      topic.novelty,
      topic.decision,
      topic.rejectionReason || null,
      topic.sourceName,
      // On conflict
      topic.score,
      topic.decision,
      topic.rejectionReason || null
    ]
  );
  saveDbToDisk();
}

export async function isTopicAlreadyProcessed(url: string, title: string): Promise<boolean> {
  const db = await getDb();
  const stmt = db.prepare(`SELECT id FROM topics WHERE url = ? OR title = ?`);
  stmt.bind([url, title]);
  const found = stmt.step();
  stmt.free();
  if (found) return true;

  // Check posts
  const stmtPost = db.prepare(`SELECT id FROM posts WHERE topic_title = ?`);
  stmtPost.bind([title]);
  const foundPost = stmtPost.step();
  stmtPost.free();
  return foundPost;
}

export async function isSimilarTopicPublished(title: string): Promise<boolean> {
  const db = await getDb();
  const stmt = db.prepare(`SELECT topic_title FROM posts`);
  let isSimilar = false;
  const targetTokens = title.toLowerCase().split(/\W+/).filter(t => t.length > 3);

  while (stmt.step()) {
    const row = stmt.getAsObject();
    const existingTitle = (row.topic_title as string) || '';
    const existingTokens = existingTitle.toLowerCase().split(/\W+/).filter(t => t.length > 3);

    // Calculate Jaccard similarity between token sets
    const intersection = targetTokens.filter(t => existingTokens.includes(t));
    if (intersection.length >= 3 && intersection.length / Math.max(targetTokens.length, 1) > 0.5) {
      isSimilar = true;
      break;
    }
  }
  stmt.free();
  return isSimilar;
}

export async function savePost(post: {
  id: string;
  agentId: string;
  topicId: string;
  topicTitle: string;
  text: string;
  rationale: string;
  score: number;
  createdAt: string;
  sources: string[];
}) {
  const db = await getDb();
  db.run(
    `INSERT INTO posts (id, agent_id, topic_id, topic_title, text, rationale, score, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      post.id,
      post.agentId,
      post.topicId,
      post.topicTitle,
      post.text,
      post.rationale,
      post.score,
      post.createdAt
    ]
  );

  for (const sourceUrl of post.sources) {
    const sourceId = `src-${post.id}-${Math.random().toString(36).substring(2, 7)}`;
    db.run(
      `INSERT INTO post_sources (id, post_id, source_url) VALUES (?, ?, ?)`,
      [sourceId, post.id, sourceUrl]
    );
  }

  // Also record in memory
  const memoryId = `mem-${post.id}`;
  db.run(
    `INSERT INTO memory (id, agent_id, topic, summary, created_at) VALUES (?, ?, ?, ?, ?)`,
    [memoryId, post.agentId, post.topicTitle, post.text, post.createdAt]
  );

  saveDbToDisk();
}

export async function getPostsForAgent(agentId: string): Promise<Post[]> {
  const db = await getDb();
  const stmt = db.prepare(
    `SELECT * FROM posts WHERE agent_id = ? ORDER BY created_at DESC`
  );
  stmt.bind([agentId]);

  const posts: Post[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    
    // Get sources for post
    const srcStmt = db.prepare(`SELECT source_url FROM post_sources WHERE post_id = ?`);
    srcStmt.bind([row.id as string]);
    const sources: string[] = [];
    while (srcStmt.step()) {
      const srcRow = srcStmt.getAsObject();
      sources.push(srcRow.source_url as string);
    }
    srcStmt.free();

    posts.push({
      id: row.id as string,
      createdAt: row.created_at as string,
      text: row.text as string,
      rationale: row.rationale as string,
      sources,
      topicTitle: (row.topic_title as string) || undefined,
      score: row.score ? Number(row.score) : undefined,
    });
  }
  stmt.free();
  return posts;
}

export async function getRejectedTopics(limit = 20): Promise<RejectedTopic[]> {
  const db = await getDb();
  const stmt = db.prepare(
    `SELECT id, title, url, source_name, discovered_at, score, rejection_reason
     FROM topics WHERE decision = 'REJECTED' ORDER BY discovered_at DESC LIMIT ?`
  );
  stmt.bind([limit]);

  const rejected: RejectedTopic[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    rejected.push({
      id: row.id as string,
      title: row.title as string,
      url: row.url as string,
      sourceName: (row.source_name as string) || 'Web Source',
      discoveredAt: row.discovered_at as string,
      score: Number(row.score),
      rejectionReason: (row.rejection_reason as string) || 'Scored below editorial threshold',
    });
  }
  stmt.free();
  return rejected;
}

export async function getAgentStats(agentId: string, lastRunAt: string | null, nextRunAt: string | null, intervalSec: number): Promise<AgentStats> {
  const db = await getDb();
  const agent = await getAgent(agentId);

  const postsStmt = db.prepare(`SELECT COUNT(*) as count FROM posts WHERE agent_id = ?`);
  postsStmt.bind([agentId]);
  postsStmt.step();
  const totalPosts = Number(postsStmt.getAsObject().count || 0);
  postsStmt.free();

  const discStmt = db.prepare(`SELECT COUNT(*) as count FROM topics`);
  discStmt.step();
  const topicsDiscovered = Number(discStmt.getAsObject().count || 0);
  discStmt.free();

  const rejStmt = db.prepare(`SELECT COUNT(*) as count FROM topics WHERE decision = 'REJECTED'`);
  rejStmt.step();
  const topicsRejected = Number(rejStmt.getAsObject().count || 0);
  rejStmt.free();

  const pubStmt = db.prepare(`SELECT COUNT(*) as count FROM topics WHERE decision = 'ACCEPTED'`);
  pubStmt.step();
  const topicsPublished = Number(pubStmt.getAsObject().count || 0);
  pubStmt.free();

  return {
    agentId,
    personaName: (agent?.name as string) || 'CyberPulse AI',
    domain: (agent?.domain as string) || 'AI Security',
    status: 'running',
    totalPosts,
    topicsDiscovered,
    topicsRejected,
    topicsPublished,
    lastRunAt,
    nextRunAt,
    autonomyIntervalSeconds: intervalSec,
  };
}
