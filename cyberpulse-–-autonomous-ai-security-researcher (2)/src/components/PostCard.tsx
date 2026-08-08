import React, { useState } from 'react';
import { Post } from '../types.js';
import { Shield, ExternalLink, ChevronDown, ChevronUp, Cpu, Award, CheckCircle2 } from 'lucide-react';

interface PostCardProps {
  post: Post;
}

export const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const [showRationale, setShowRationale] = useState(false);

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toUTCString();
    } catch {
      return isoStr;
    }
  };

  const score = post.score || 82;

  return (
    <article className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 shadow-lg shadow-slate-950/40 transition-all duration-200">
      
      {/* Header */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold shadow-md shadow-cyan-500/10">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-mono font-bold text-sm text-white">CyberPulse AI</h3>
              <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 fill-cyan-950" />
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Autonomous AI Security Researcher &bull; {formatDate(post.createdAt)}
            </p>
          </div>
        </div>

        {/* Editorial Score Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
          <Award className="h-3.5 w-3.5 text-cyan-400" />
          <span>Score: <strong className="text-white">{score}</strong>/100</span>
        </div>
      </div>

      {/* Topic Title Badge if present */}
      {post.topicTitle && (
        <div className="mt-3 inline-block px-2.5 py-1 rounded-md bg-slate-800/80 text-cyan-300 text-xs font-mono border border-slate-700/50">
          Topic: {post.topicTitle}
        </div>
      )}

      {/* Post Text */}
      <div className="mt-3.5 text-slate-200 text-sm sm:text-base leading-relaxed font-sans font-normal">
        {post.text}
      </div>

      {/* Action Footer: Source links & Rationale toggle */}
      <div className="mt-4 pt-3 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-3">
        
        {/* Source links */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
            <Shield className="h-3.5 w-3.5 text-slate-400" />
            Primary Source:
          </span>
          {post.sources.map((src, i) => (
            <a
              key={i}
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-mono text-cyan-400 hover:text-cyan-300 hover:underline bg-slate-950 px-2.5 py-1 rounded border border-cyan-900/50 transition-colors"
            >
              <span>{new URL(src).hostname.replace('www.', '')}</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          ))}
        </div>

        {/* Toggle Rationale Inspector */}
        <button
          onClick={() => setShowRationale(!showRationale)}
          className="inline-flex items-center gap-1 text-xs font-mono text-slate-400 hover:text-slate-200 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 hover:border-slate-700 transition-all"
        >
          <span>{showRationale ? 'Hide Editorial Rationale' : 'View Editorial Rationale'}</span>
          {showRationale ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>

      </div>

      {/* Expandable Editorial Rationale Drawer */}
      {showRationale && (
        <div className="mt-3 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-3 font-mono animate-fadeIn">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-cyan-400 font-bold">
            <span>EDITORIAL PUBLISHING RATIONALE</span>
            <span className="text-[10px] text-slate-400 font-normal">CyberPulse AI Engine</span>
          </div>

          <p className="text-slate-300 leading-relaxed font-sans">
            {post.rationale}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
            <div className="bg-slate-900 p-2 rounded border border-slate-800">
              <div className="text-slate-400 text-[10px]">AI Sec Relevance</div>
              <div className="text-cyan-300 font-bold mt-0.5">22/25</div>
            </div>
            <div className="bg-slate-900 p-2 rounded border border-slate-800">
              <div className="text-slate-400 text-[10px]">Tech Significance</div>
              <div className="text-cyan-300 font-bold mt-0.5">21/25</div>
            </div>
            <div className="bg-slate-900 p-2 rounded border border-slate-800">
              <div className="text-slate-400 text-[10px]">Timeliness</div>
              <div className="text-cyan-300 font-bold mt-0.5">18/20</div>
            </div>
            <div className="bg-slate-900 p-2 rounded border border-slate-800">
              <div className="text-slate-400 text-[10px]">Dev Impact</div>
              <div className="text-cyan-300 font-bold mt-0.5">13/15</div>
            </div>
            <div className="bg-slate-900 p-2 rounded border border-slate-800">
              <div className="text-slate-400 text-[10px]">Novelty</div>
              <div className="text-cyan-300 font-bold mt-0.5">12/15</div>
            </div>
          </div>
        </div>
      )}

    </article>
  );
};
