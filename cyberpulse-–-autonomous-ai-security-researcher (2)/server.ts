import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  createOrUpdateAgent,
  getPostsForAgent,
  getAgentStats,
  getRejectedTopics,
  getFirstAgentId,
  getDb
} from './src/server/database.js';
import {
  startAutonomousScheduler,
  runResearchCycle,
  getSchedulerState
} from './src/server/scheduler.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize SQLite database on startup
  await getDb();

  // Auto-start scheduler if an agent already exists in memory/DB
  const existingAgentId = await getFirstAgentId();
  if (existingAgentId) {
    console.log(`[CyberPulse AI] Found existing agent ${existingAgentId}. Auto-starting autonomous scheduler...`);
    startAutonomousScheduler(existingAgentId);
  } else {
    // Default bootstrap agent
    const defaultAgentId = 'cyberpulse-main';
    await createOrUpdateAgent(defaultAgentId, 'CyberPulse AI', 'AI Security');
    startAutonomousScheduler(defaultAgentId);
  }

  // --- REQUIRED PUBLIC HACKATHON API ENDPOINTS ---

  /**
   * POST /api/agent/init
   * Initializing endpoint called exactly once by the evaluator or user.
   */
  app.post('/api/agent/init', async (req, res) => {
    try {
      const { persona } = req.body || {};
      const name = persona?.name || 'CyberPulse AI';
      const domain = persona?.domain || 'AI Security';

      const agentId = 'cyberpulse-main';

      // Save persona configuration & create agent
      await createOrUpdateAgent(agentId, name, domain);

      // Start the autonomous background scheduler
      startAutonomousScheduler(agentId);

      // Trigger immediate topic discovery cycle asynchronously
      runResearchCycle(agentId).catch((err) =>
        console.error('[Init] Error in initial research cycle:', err)
      );

      return res.status(200).json({ agentId });
    } catch (err) {
      console.error('[POST /api/agent/init] Error:', err);
      return res.status(500).json({ error: 'Failed to initialize agent' });
    }
  });

  /**
   * GET /api/agent/feed?agentId=abc-123
   * Evaluator endpoint to fetch feed of published autonomous posts.
   */
  app.get('/api/agent/feed', async (req, res) => {
    try {
      let agentId = req.query.agentId as string;

      if (!agentId) {
        agentId = (await getFirstAgentId()) || 'cyberpulse-main';
      }

      const posts = await getPostsForAgent(agentId);

      return res.status(200).json({ posts });
    } catch (err) {
      console.error('[GET /api/agent/feed] Error:', err);
      return res.status(200).json({ posts: [] });
    }
  });

  // --- DASHBOARD API ENDPOINTS ---

  app.get('/api/agent/stats', async (req, res) => {
    try {
      let agentId = req.query.agentId as string;
      if (!agentId) {
        agentId = (await getFirstAgentId()) || 'cyberpulse-main';
      }

      const schedulerState = getSchedulerState();
      const stats = await getAgentStats(
        agentId,
        schedulerState.lastRunAt,
        schedulerState.nextRunAt,
        schedulerState.intervalSeconds
      );

      return res.status(200).json(stats);
    } catch (err) {
      console.error('[GET /api/agent/stats] Error:', err);
      return res.status(500).json({ error: 'Failed to fetch agent stats' });
    }
  });

  app.get('/api/agent/rejected', async (req, res) => {
    try {
      const rejected = await getRejectedTopics(30);
      return res.status(200).json({ rejected });
    } catch (err) {
      console.error('[GET /api/agent/rejected] Error:', err);
      return res.status(200).json({ rejected: [] });
    }
  });

  app.post('/api/agent/trigger', async (req, res) => {
    try {
      let { agentId } = req.body || {};
      if (!agentId) {
        agentId = (await getFirstAgentId()) || 'cyberpulse-main';
      }

      const result = await runResearchCycle(agentId);
      return res.status(200).json({
        message: 'Research cycle completed successfully',
        result
      });
    } catch (err) {
      console.error('[POST /api/agent/trigger] Error:', err);
      return res.status(500).json({ error: 'Manual research cycle failed' });
    }
  });

  app.get('/api/health', (req, res) => {
    return res.json({
      status: 'ok',
      agent: 'CyberPulse AI',
      timestamp: new Date().toISOString()
    });
  });

  // --- VITE MIDDLEWARE / PRODUCTION STATIC FILES ---

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[CyberPulse AI] Server listening at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server Start Error]', err);
});
