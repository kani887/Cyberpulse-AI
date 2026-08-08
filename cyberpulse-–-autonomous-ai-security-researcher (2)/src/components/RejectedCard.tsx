import React from 'react';
import { RejectedTopic } from '../types.js';
import { FilterX, ExternalLink, AlertTriangle } from 'lucide-react';

interface RejectedCardProps {
  topic: RejectedTopic;
}

export const RejectedCard: React.FC<RejectedCardProps> = ({ topic }) => {
  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="bg-slate-900/60 border border-rose-900/30 hover:border-rose-800/50 rounded-xl p-4 transition-all">
      <div className="flex items-start justify-between gap-3">
        
        <div className="flex items-start gap-3">
          <div className="mt-0.5 p-2 rounded-lg bg-rose-950/80 border border-rose-800/40 text-rose-400">
            <FilterX className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold text-rose-300 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-900/50">
                REJECTED
              </span>
              <span className="text-xs font-mono text-slate-400">
                {topic.sourceName} &bull; {formatDate(topic.discoveredAt)}
              </span>
            </div>
            <h4 className="text-sm font-semibold text-slate-200 mt-1.5 leading-snug">
              {topic.title}
            </h4>
          </div>
        </div>

        {/* Score Badge */}
        <div className="text-right font-mono flex-shrink-0">
          <div className="text-xs text-slate-400">Score</div>
          <div className="text-sm font-bold text-rose-400">{topic.score}/100</div>
        </div>

      </div>

      {/* Rejection Reason */}
      <div className="mt-3 p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-xs font-mono text-slate-300 flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="text-amber-400 font-bold">Editorial Filter Rationale: </span>
          {topic.rejectionReason}
        </div>
      </div>

      {/* External Link */}
      <div className="mt-2.5 text-right">
        <a
          href={topic.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-slate-200"
        >
          <span>View Source Candidate</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
};
