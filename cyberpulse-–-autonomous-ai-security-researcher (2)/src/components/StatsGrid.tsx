import React from 'react';
import { AgentStats } from '../types.js';
import { Newspaper, Search, FilterX, CheckCircle, Clock, Zap } from 'lucide-react';

interface StatsGridProps {
  stats: AgentStats | null;
}

export const StatsGrid: React.FC<StatsGridProps> = ({ stats }) => {
  const totalDiscovered = stats?.topicsDiscovered || 0;
  const totalRejected = stats?.topicsRejected || 0;
  const totalPublished = stats?.totalPosts || 0;
  const filterRate = totalDiscovered > 0 ? Math.round((totalRejected / totalDiscovered) * 100) : 0;

  const formatDate = (isoStr: string | null) => {
    if (!isoStr) return 'Pending...';
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {/* Total Posts */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-sm">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-xs font-mono font-medium">Published Posts</span>
          <Newspaper className="h-4 w-4 text-cyan-400" />
        </div>
        <div className="text-2xl font-bold font-mono text-white">{totalPublished}</div>
        <div className="text-[10px] text-cyan-400 font-mono mt-1">Verified Insights</div>
      </div>

      {/* Discovered */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-sm">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-xs font-mono font-medium">Topics Discovered</span>
          <Search className="h-4 w-4 text-blue-400" />
        </div>
        <div className="text-2xl font-bold font-mono text-white">{totalDiscovered}</div>
        <div className="text-[10px] text-slate-400 font-mono mt-1">Live Web/RSS Feeds</div>
      </div>

      {/* Rejected */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-sm">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-xs font-mono font-medium">Topics Rejected</span>
          <FilterX className="h-4 w-4 text-rose-400" />
        </div>
        <div className="text-2xl font-bold font-mono text-rose-400">{totalRejected}</div>
        <div className="text-[10px] text-rose-400/80 font-mono mt-1">{filterRate}% Editorial Filter</div>
      </div>

      {/* Accepted */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-sm">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-xs font-mono font-medium">Topics Accepted</span>
          <CheckCircle className="h-4 w-4 text-emerald-400" />
        </div>
        <div className="text-2xl font-bold font-mono text-emerald-400">{stats?.topicsPublished || 0}</div>
        <div className="text-[10px] text-emerald-400/80 font-mono mt-1">Score &ge; 65/100</div>
      </div>

      {/* Last Run */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-sm">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-xs font-mono font-medium">Last Cycle</span>
          <Clock className="h-4 w-4 text-amber-400" />
        </div>
        <div className="text-sm font-bold font-mono text-slate-200 mt-1">
          {formatDate(stats?.lastRunAt || null)}
        </div>
        <div className="text-[10px] text-amber-400/80 font-mono mt-1">Completed</div>
      </div>

      {/* Next Run */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-sm">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-xs font-mono font-medium">Next Cycle</span>
          <Zap className="h-4 w-4 text-purple-400 animate-pulse" />
        </div>
        <div className="text-sm font-bold font-mono text-purple-300 mt-1">
          {formatDate(stats?.nextRunAt || null)}
        </div>
        <div className="text-[10px] text-purple-400/80 font-mono mt-1">Auto Scheduler</div>
      </div>
    </div>
  );
};
