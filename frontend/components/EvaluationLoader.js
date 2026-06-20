'use client';

import { useEffect, useState } from 'react';

const AGENTS = [
  { key: 'clarity', label: 'CLARITY AGENT', icon: '◎', color: 'bg-purple text-white' },
  { key: 'structure', label: 'STRUCTURE AGENT', icon: '▦', color: 'bg-black text-cream' },
  { key: 'originality', label: 'ORIGINALITY AGENT', icon: '⬡', color: 'bg-purple text-white' },
  { key: 'outputQuality', label: 'OUTPUT AGENT', icon: '▶', color: 'bg-black text-cream' },
];

function AgentRow({ agent, result, index, revealed }) {
  const [bar, setBar] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setBar(100), 200 + index * 150);
    return () => clearTimeout(t);
  }, [index]);

  const score = result?.score ?? null;
  const done = score !== null;

  return (
    <div className="border-2 border-black p-4 bg-white">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className={`font-mono text-lg w-8 h-8 flex items-center justify-center border-2 border-black ${agent.color}`}>
            {agent.icon}
          </span>
          <span className="font-mono font-bold text-sm">{agent.label}</span>
        </div>
        <div className="font-mono text-sm">
          {done && revealed ? (
            <span
              className={`font-black text-lg px-2 py-1 border-2 border-black ${
                score >= 80 ? 'bg-green-400' : score >= 60 ? 'bg-yellow-400' : 'bg-red-400'
              }`}
            >
              {score}/100
            </span>
          ) : (
            <span className="text-gray-400 text-xs animate-pulse">
              {done ? 'processing...' : 'evaluating...'}
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-gray-200 border border-black overflow-hidden">
        <div
          className="h-full bg-purple transition-all duration-1000 ease-out"
          style={{ width: done ? `${score}%` : `${bar}%` }}
        />
      </div>

      {/* Feedback (shown after reveal) */}
      {done && revealed && result.feedback?.length > 0 && (
        <ul className="mt-3 space-y-1">
          {result.feedback.slice(0, 2).map((f, i) => (
            <li key={i} className="font-mono text-xs text-gray-700 flex gap-2">
              <span className="text-purple flex-shrink-0">›</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function EvaluationLoader({ isLoading, result, monadScanUrl, onComplete }) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!isLoading && result) {
      const t = setTimeout(() => {
        setRevealed(true);
        onComplete?.();
      }, 600);
      return () => clearTimeout(t);
    }
  }, [isLoading, result, onComplete]);

  const agentResults = result
    ? {
        clarity: { score: result.clarityScore, feedback: result.clarityFeedback },
        structure: { score: result.structureScore, feedback: result.structureFeedback },
        originality: { score: result.originalityScore, feedback: result.originalityFeedback },
        outputQuality: { score: result.outputQualityScore, feedback: result.outputQualityFeedback },
      }
    : {};

  return (
    <div className="border-3 border-black bg-cream p-6">
      <div className="flex items-center gap-3 mb-5 pb-4 border-b-2 border-black">
        <div className={`w-3 h-3 rounded-full border-2 border-black ${isLoading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`} />
        <span className="font-mono font-bold text-sm">
          {isLoading ? 'RUNNING 4 AGENTS IN PARALLEL...' : 'EVALUATION COMPLETE'}
        </span>
        {isLoading && (
          <span className="font-mono text-xs text-gray-500 ml-auto">Promise.all()</span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3">
        {AGENTS.map((agent, i) => (
          <AgentRow
            key={agent.key}
            agent={agent}
            result={agentResults[agent.key]}
            index={i}
            revealed={revealed}
          />
        ))}
      </div>

      {/* Overall score reveal */}
      {revealed && result && (
        <div className="mt-5 border-2 border-black bg-purple text-white p-5 flex items-center justify-between">
          <div>
            <p className="font-mono font-bold text-lg">OVERALL SCORE</p>
            {result.isPlagiarism && (
              <p className="font-mono text-xs text-red-300 mt-1">⚠ Plagiarism detected — originality score zeroed</p>
            )}
          </div>
          <div className="text-right">
            <p className="font-mono font-black text-5xl">{result.overallScore}</p>
            <p className="font-mono text-xs opacity-70">/100</p>
          </div>
        </div>
      )}

      {revealed && result && (
        <div className="mt-3 border-2 border-black bg-white">
          {monadScanUrl ? (
            <a
              href={monadScanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-4 py-3 group hover:bg-purple hover:text-white transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 border border-black flex-shrink-0" />
                <span className="font-mono text-xs font-bold group-hover:text-white">
                  ✓ SCORE LOGGED ON-CHAIN · MONAD TESTNET
                </span>
              </div>
              <span className="font-mono text-xs text-purple group-hover:text-white font-bold">
                VIEW ON MONADSCAN ↗
              </span>
            </a>
          ) : (
            <div className="font-mono text-xs text-center text-gray-500 py-3">
              ✓ SCORE LOGGED ON-CHAIN · MONAD TESTNET
            </div>
          )}
        </div>
      )}
    </div>
  );
}
