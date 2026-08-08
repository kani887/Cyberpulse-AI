import React, { useState } from 'react';
import { AgentStats } from '../types.js';
import { Cpu, Terminal, Database, Code, CheckCircle2, Play, Copy, Check } from 'lucide-react';

interface AgentInfoTabProps {
  stats: AgentStats | null;
  onInit: () => void;
  isInitializing: boolean;
}

export const AgentInfoTab: React.FC<AgentInfoTabProps> = ({
  stats,
  onInit,
  isInitializing,
}) => {
  const [copiedInit, setCopiedInit] = useState(false);
  const [copiedFeed, setCopiedFeed] = useState(false);

  const initCurl = `curl -X POST "${window.location.origin}/api/agent/init" \\
  -H "Content-Type: application/json" \\
  -d '{"persona":{"name":"CyberPulse AI","domain":"AI Security"}}'`;

  const feedCurl = `curl "${window.location.origin}/api/agent/feed?agentId=${stats?.agentId || 'cyberpulse-main'}"`;

  const copyToClipboard = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Persona Overview Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="p-3 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-400">
            <Cpu className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
              Persona: {stats?.personaName || 'CyberPulse AI'}
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                ACTIVE
              </span>
            </h2>
            <p className="text-xs text-cyan-400 font-mono italic mt-0.5">
              “Don’t chase AI hype. Find what actually matters.”
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="text-slate-400 font-bold mb-2 text-cyan-300">Identity & Focus</div>
            <p className="text-slate-300 leading-relaxed font-sans">
              Autonomous AI security researcher focused on artificial intelligence, machine learning, LLMs, cybersecurity, prompt injection, AI vulnerabilities, AI safety, open-source AI security and developer security.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="text-slate-400 font-bold mb-2 text-cyan-300">Personality Traits</div>
            <ul className="text-slate-300 space-y-1 list-disc list-inside">
              <li>Technical & Analytical</li>
              <li>Developer & Engineering Focused</li>
              <li>Evidence-Driven & Hype-Skeptical</li>
              <li>Concise, Insightful, Zero Sensationalism</li>
              <li>Never Invents Facts or Sources</li>
            </ul>
          </div>
        </div>

        {/* Editorial Principles */}
        <div className="mt-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div className="text-xs font-mono font-bold text-cyan-300 mb-2">Editorial Principles</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
              <span>Security relevance first</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
              <span>Technical significance &gt; popularity</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
              <span>Prefer primary sources</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
              <span>Avoid generic AI news</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
              <span>Avoid repetitive topics</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
              <span>Score threshold &ge; 65/100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Evaluator API Documentation */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-white font-mono font-bold">
            <Code className="h-5 w-5 text-cyan-400" />
            <span>Public API Endpoints (Evaluator Specification)</span>
          </div>
          <button
            onClick={onInit}
            disabled={isInitializing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-semibold shadow-md shadow-cyan-600/20 transition-all disabled:opacity-50"
          >
            <Play className="h-3.5 w-3.5 fill-white" />
            {isInitializing ? 'Initializing Agent...' : 'Trigger POST /api/agent/init'}
          </button>
        </div>

        {/* POST /api/agent/init */}
        <div className="space-y-2 font-mono">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-0.5 rounded font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                POST
              </span>
              <span className="text-white font-bold">/api/agent/init</span>
              <span className="text-slate-400 text-[11px]">(Call once to start agent)</span>
            </div>
            <button
              onClick={() => copyToClipboard(initCurl, setCopiedInit)}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1"
            >
              {copiedInit ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedInit ? 'Copied!' : 'Copy cURL'}</span>
            </button>
          </div>
          <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-cyan-300 overflow-x-auto">
            {initCurl}
          </pre>
        </div>

        {/* GET /api/agent/feed */}
        <div className="space-y-2 font-mono">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-0.5 rounded font-bold bg-blue-950 text-blue-400 border border-blue-800/60">
                GET
              </span>
              <span className="text-white font-bold">/api/agent/feed?agentId={stats?.agentId || 'cyberpulse-main'}</span>
              <span className="text-slate-400 text-[11px]">(Evaluator feed reader)</span>
            </div>
            <button
              onClick={() => copyToClipboard(feedCurl, setCopiedFeed)}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1"
            >
              {copiedFeed ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedFeed ? 'Copied!' : 'Copy cURL'}</span>
            </button>
          </div>
          <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-blue-300 overflow-x-auto">
            {feedCurl}
          </pre>
        </div>
      </div>

      {/* System Persistence & Architecture */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl font-mono text-xs text-slate-300 space-y-3">
        <div className="flex items-center gap-2 text-white font-bold">
          <Database className="h-5 w-5 text-cyan-400" />
          <span>SQLite Memory & Background Engine Status</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-300 font-sans">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="text-cyan-400 font-mono font-bold">Database Storage</div>
            <div className="text-slate-400 text-xs mt-1">
              SQLite file (<code className="text-cyan-300">data.sqlite</code>) persists all agents, discovered topics, editorial decisions, generated posts, sources, and memory records across server restarts.
            </div>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="text-cyan-400 font-mono font-bold">Autonomous Scheduler</div>
            <div className="text-slate-400 text-xs mt-1">
              Non-blocking Node.js interval loop triggers background topic discovery, memory duplicate checking, editorial evaluation, and automatic post generation continuously.
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
