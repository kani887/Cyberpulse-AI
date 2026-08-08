import React, { useState, useEffect, useCallback } from 'react';
import { Post, RejectedTopic, AgentStats } from './types.js';
import { Header } from './components/Header.tsx';
import { StatsGrid } from './components/StatsGrid.tsx';
import { PostCard } from './components/PostCard.tsx';
import { RejectedCard } from './components/RejectedCard.tsx';
import { AgentInfoTab } from './components/AgentInfoTab.tsx';
import { Newspaper, FilterX, Cpu, Radio, RefreshCw, Info } from 'lucide-react';

export default function App() {
  const [agentId, setAgentId] = useState<string>('cyberpulse-main');
  const [posts, setPosts] = useState<Post[]>([]);
  const [rejectedTopics, setRejectedTopics] = useState<RejectedTopic[]>([]);
  const [stats, setStats] = useState<AgentStats | null>(null);
  
  const [activeTab, setActiveTab] = useState<'feed' | 'rejected' | 'agent_info'>('feed');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isTriggering, setIsTriggering] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

  // Fetch all dashboard data
  const fetchData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // 1. Fetch Posts
      const feedRes = await fetch(`/api/agent/feed?agentId=${agentId}`);
      if (feedRes.ok) {
        const feedData = await feedRes.json();
        setPosts(feedData.posts || []);
      }

      // 2. Fetch Stats
      const statsRes = await fetch(`/api/agent/stats?agentId=${agentId}`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // 3. Fetch Rejected
      const rejectedRes = await fetch('/api/agent/rejected');
      if (rejectedRes.ok) {
        const rejectedData = await rejectedRes.json();
        setRejectedTopics(rejectedData.rejected || []);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [agentId]);

  // Initial load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh polling every 5 seconds so background posts show up live
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchData();
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  // Initialize Agent
  const handleInitializeAgent = async () => {
    setIsInitializing(true);
    try {
      const res = await fetch('/api/agent/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persona: {
            name: 'CyberPulse AI',
            domain: 'AI Security',
          },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.agentId) {
          setAgentId(data.agentId);
        }
        await fetchData();
      }
    } catch (err) {
      console.error('Error initializing agent:', err);
    } finally {
      setIsInitializing(false);
    }
  };

  // Trigger Immediate Cycle
  const handleTriggerCycleNow = async () => {
    setIsTriggering(true);
    try {
      await fetch('/api/agent/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId }),
      });
      await fetchData();
    } catch (err) {
      console.error('Error triggering research cycle:', err);
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950 antialiased">
      
      {/* Top Header */}
      <Header
        status={stats?.status || 'running'}
        lastRunAt={stats?.lastRunAt || null}
        nextRunAt={stats?.nextRunAt || null}
        autonomyIntervalSeconds={stats?.autonomyIntervalSeconds || 180}
        onRefresh={fetchData}
        isRefreshing={isRefreshing}
        onTriggerNow={handleTriggerCycleNow}
        isTriggering={isTriggering}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Live Auto-Refresh Banner */}
        <div className="mb-6 bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-cyan-300">
            <Radio className="h-4 w-4 text-cyan-400 animate-pulse" />
            <span>Autonomous Engine active. Background discovery generates posts continuously over time.</span>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white select-none">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded bg-slate-950 border-slate-800 text-cyan-500 focus:ring-cyan-500/20"
              />
              <span>Live Auto-Refresh</span>
            </label>
          </div>
        </div>

        {/* Stats Grid */}
        <StatsGrid stats={stats} />

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800 mb-6 pb-2">
          <nav className="flex items-center gap-2 font-mono text-xs sm:text-sm">
            <button
              onClick={() => setActiveTab('feed')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                activeTab === 'feed'
                  ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40 shadow-lg shadow-cyan-500/10 font-bold'
                  : 'bg-slate-900/40 text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Newspaper className="h-4 w-4" />
              <span>Published Feed ({posts.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('rejected')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                activeTab === 'rejected'
                  ? 'bg-rose-950/80 text-rose-300 border-rose-500/40 shadow-lg shadow-rose-500/10 font-bold'
                  : 'bg-slate-900/40 text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <FilterX className="h-4 w-4" />
              <span>Editorial Filter ({rejectedTopics.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('agent_info')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                activeTab === 'agent_info'
                  ? 'bg-purple-950/80 text-purple-300 border-purple-500/40 shadow-lg shadow-purple-500/10 font-bold'
                  : 'bg-slate-900/40 text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Cpu className="h-4 w-4" />
              <span>Agent & API</span>
            </button>
          </nav>

          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400">
            <Info className="h-3.5 w-3.5 text-cyan-400" />
            <span>Score threshold &ge; 65/100 required for feed publication</span>
          </div>
        </div>

        {/* Tab 1: Published Feed */}
        {activeTab === 'feed' && (
          <section className="space-y-4">
            {posts.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center space-y-3 font-mono">
                <RefreshCw className="h-8 w-8 text-cyan-400 animate-spin mx-auto" />
                <h3 className="text-base text-white font-bold">Autonomous Research Engine In Progress</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  The agent is discovering live AI security topics and evaluating them against editorial principles. New published posts will appear automatically.
                </p>
                <button
                  onClick={handleInitializeAgent}
                  disabled={isInitializing}
                  className="mt-4 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs"
                >
                  {isInitializing ? 'Initializing...' : 'Initialize Agent Now'}
                </button>
              </div>
            ) : (
              posts.map((post) => <PostCard key={post.id} post={post} />)
            )}
          </section>
        )}

        {/* Tab 2: Editorial Filtered / Rejected Topics */}
        {activeTab === 'rejected' && (
          <section className="space-y-3">
            <div className="bg-slate-900/80 border border-rose-900/30 p-4 rounded-xl text-xs font-mono text-rose-300 mb-4 flex items-center gap-2">
              <FilterX className="h-4 w-4 text-rose-400 flex-shrink-0" />
              <span>
                CyberPulse AI evaluates candidates against strict editorial criteria. Low-value, hype-driven, duplicate, or unverified topics scoring below 65/100 are rejected automatically.
              </span>
            </div>

            {rejectedTopics.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-xs font-mono">
                No rejected candidates recorded yet.
              </div>
            ) : (
              rejectedTopics.map((topic) => <RejectedCard key={topic.id} topic={topic} />)
            )}
          </section>
        )}

        {/* Tab 3: Agent Persona & API Specs */}
        {activeTab === 'agent_info' && (
          <AgentInfoTab
            stats={stats}
            onInit={handleInitializeAgent}
            isInitializing={isInitializing}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-900 bg-slate-950 py-8 text-center text-xs text-slate-500 font-mono">
        <p>CyberPulse AI &bull; Autonomous AI Security Researcher &bull; AI Studio Full-Stack Applet</p>
      </footer>

    </div>
  );
}
