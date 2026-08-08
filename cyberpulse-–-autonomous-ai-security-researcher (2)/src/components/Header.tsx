import React from 'react';
import { ShieldCheck, Cpu, RefreshCw } from 'lucide-react';

interface HeaderProps {
  status: 'running' | 'idle' | 'stopped';
  lastRunAt: string | null;
  nextRunAt: string | null;
  autonomyIntervalSeconds: number;
  onRefresh: () => void;
  isRefreshing: boolean;
  onTriggerNow: () => void;
  isTriggering: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  autonomyIntervalSeconds,
  onRefresh,
  isRefreshing,
  onTriggerNow,
  isTriggering,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Title & Tagline */}
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 p-0.5 shadow-lg shadow-cyan-500/20 flex items-center justify-center">
              <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Cpu className="h-6 w-6 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white font-mono">
                  CyberPulse AI
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-cyan-950 text-cyan-300 border border-cyan-800/50">
                  v2.0 Autonomous
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Autonomous AI Security Researcher & Editorial Filter Engine
              </p>
            </div>
          </div>

          {/* Status & Quick Actions */}
          <div className="flex items-center flex-wrap gap-3">
            {/* Status Badge */}
            <div className="flex items-center gap-2 bg-slate-900 border border-emerald-500/30 rounded-full px-3.5 py-1.5 shadow-inner">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-semibold text-emerald-400 font-mono tracking-wide">
                Autonomous Agent Running
              </span>
              <span className="text-[10px] text-slate-500 border-l border-slate-800 pl-2 font-mono">
                Interval: {autonomyIntervalSeconds}s
              </span>
            </div>

            {/* Action Buttons */}
            <button
              onClick={onTriggerNow}
              disabled={isTriggering}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 transition-all disabled:opacity-50"
              title="Run an immediate research discovery cycle"
            >
              <Cpu className={`h-3.5 w-3.5 ${isTriggering ? 'animate-spin' : ''}`} />
              {isTriggering ? 'Executing Cycle...' : 'Run Cycle Now'}
            </button>

            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
              title="Refresh Dashboard"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
