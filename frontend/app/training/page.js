'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import EvaluationLoader from '@/components/EvaluationLoader';
import { getChallenges, getTrainingProgress, submitTraining } from '@/lib/api';

const CATEGORY_COLORS = {
  'Technical Writing': 'bg-blue-100',
  'Debugging': 'bg-red-100',
  'Creative Writing': 'bg-pink-100',
  'Code Generation': 'bg-green-100',
  'Testing': 'bg-yellow-100',
};

function WalletGate({ children }) {
  const { address, connect } = useWallet();
  if (address) return children;
  return (
    <div className="border-2 border-black p-12 text-center bg-white">
      <p className="font-mono font-black text-xl mb-2">WALLET NOT CONNECTED</p>
      <p className="font-mono text-sm text-gray-500 mb-6">Connect your wallet to track your training progress on-chain.</p>
      <button
        onClick={connect}
        className="font-mono font-bold text-sm px-6 py-3 bg-purple text-white border-2 border-black shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
      >
        CONNECT WALLET
      </button>
    </div>
  );
}

export default function TrainingPage() {
  const { address } = useWallet();

  const [challenges, setChallenges] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loadingChallenges, setLoadingChallenges] = useState(true);

  const [activeChallenge, setActiveChallenge] = useState(null);
  const [promptText, setPromptText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [evalResult, setEvalResult] = useState(null);
  const [monadScanUrl, setMonadScanUrl] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getChallenges()
      .then(d => setChallenges(d.challenges || []))
      .catch(() => {})
      .finally(() => setLoadingChallenges(false));
  }, []);

  useEffect(() => {
    if (!address) return;
    getTrainingProgress(address)
      .then(d => setProgress(d))
      .catch(() => {});
  }, [address]);

  async function handleSubmit() {
    if (!promptText.trim()) return;
    if (!activeChallenge) return;
    setSubmitting(true);
    setEvalResult(null);
    setMonadScanUrl(null);
    setError('');
    try {
      const data = await submitTraining(address, activeChallenge.challengeId, promptText.trim());
      setEvalResult(data.evaluation);
      if (data.monadScanUrl) setMonadScanUrl(data.monadScanUrl);
      // Refresh progress
      if (address) getTrainingProgress(address).then(setProgress).catch(() => {});
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  function openChallenge(c) {
    setActiveChallenge(c);
    setPromptText('');
    setEvalResult(null);
    setError('');
  }

  const progressPct = progress ? Math.min((progress.averageScore / 75) * 100, 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-8">
        <span className="font-mono text-xs font-bold px-3 py-1 border-2 border-black bg-black text-cream">TRAINING</span>
        <h1 className="font-mono font-black text-4xl mt-4">BECOME AN EXPERT.</h1>
        <p className="font-mono text-gray-500 mt-2">Average 75/100 across challenges → Expert status on-chain → Mint rights unlocked.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Progress + Challenge List */}
        <div className="lg:col-span-1 space-y-4">

          {/* Progress Card */}
          <WalletGate>
            <div className="border-2 border-black bg-white p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="font-mono font-black text-sm">YOUR PROGRESS</p>
                {progress?.isExpert && (
                  <span className="font-mono text-xs font-bold px-2 py-1 bg-purple text-white border-2 border-black">
                    ★ EXPERT
                  </span>
                )}
              </div>

              {progress ? (
                <>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="border-2 border-black p-3 text-center">
                      <p className="font-mono font-black text-3xl">{progress.averageScore}</p>
                      <p className="font-mono text-xs text-gray-500">AVG SCORE</p>
                    </div>
                    <div className="border-2 border-black p-3 text-center">
                      <p className="font-mono font-black text-3xl">{progress.attemptCount}</p>
                      <p className="font-mono text-xs text-gray-500">ATTEMPTS</p>
                    </div>
                  </div>

                  <div className="mb-2 flex justify-between">
                    <span className="font-mono text-xs text-gray-500">Progress to Expert</span>
                    <span className="font-mono text-xs font-bold">{progress.averageScore} / 75</span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 border-2 border-black overflow-hidden">
                    <div
                      className="h-full bg-purple transition-all duration-700"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  {progress.isExpert ? (
                    <p className="font-mono text-xs text-green-600 font-bold mt-2">
                      ✓ Expert status active — go mint your prompts!
                    </p>
                  ) : (
                    <p className="font-mono text-xs text-gray-400 mt-2">
                      {Math.max(0, 75 - progress.averageScore)} points to Expert
                    </p>
                  )}
                </>
              ) : (
                <p className="font-mono text-sm text-gray-400 animate-pulse">Loading progress...</p>
              )}
            </div>
          </WalletGate>

          {/* Challenge list */}
          <div className="border-2 border-black">
            <div className="border-b-2 border-black p-3 bg-black">
              <p className="font-mono font-bold text-cream text-sm">CHALLENGES</p>
            </div>
            {loadingChallenges ? (
              <div className="p-4 space-y-2">
                {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-100 border border-black animate-pulse" />)}
              </div>
            ) : challenges.length === 0 ? (
              <div className="p-6 text-center">
                <p className="font-mono text-sm text-gray-400">No challenges yet.</p>
              </div>
            ) : (
              <div className="divide-y-2 divide-black">
                {challenges.map(c => (
                  <button
                    key={c.challengeId}
                    onClick={() => openChallenge(c)}
                    className={`w-full text-left p-4 hover:bg-purple hover:text-white transition-colors group ${activeChallenge?.challengeId === c.challengeId ? 'bg-purple text-white' : 'bg-white'}`}
                  >
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className={`font-mono text-xs font-bold px-2 py-0.5 border ${activeChallenge?.challengeId === c.challengeId ? 'border-white bg-white text-purple' : `${CATEGORY_COLORS[c.category] || 'bg-gray-100'} border-black`}`}>
                        {c.category}
                      </span>
                      {c.difficulty && (
                        <span className={`font-mono text-xs px-2 py-0.5 border ${
                          activeChallenge?.challengeId === c.challengeId
                            ? 'border-white text-white'
                            : c.difficulty === 'Expert' ? 'border-red-400 text-red-600'
                            : c.difficulty === 'Advanced' ? 'border-orange-400 text-orange-600'
                            : c.difficulty === 'Intermediate' ? 'border-yellow-500 text-yellow-700'
                            : 'border-green-400 text-green-700'
                        }`}>
                          {c.difficulty}
                        </span>
                      )}
                    </div>
                    <p className="font-mono text-sm font-bold line-clamp-2">
                      {c.problemStatement}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Challenge panel */}
        <div className="lg:col-span-2">
          {!activeChallenge ? (
            <div className="border-2 border-black p-16 text-center bg-white h-full flex flex-col items-center justify-center">
              <p className="font-mono text-4xl mb-4">◎</p>
              <p className="font-mono font-black text-lg mb-2">SELECT A CHALLENGE</p>
              <p className="font-mono text-sm text-gray-400">Pick a challenge from the left to start writing your prompt.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Challenge header */}
              <div className="border-2 border-black bg-white p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className={`font-mono text-xs font-bold px-2 py-1 border-2 border-black ${CATEGORY_COLORS[activeChallenge.category] || 'bg-gray-100'}`}>
                    {activeChallenge.category}
                  </span>
                  <span className="font-mono text-xs text-gray-400">Challenge #{activeChallenge.challengeId}</span>
                </div>
                <h2 className="font-mono font-black text-xl leading-tight">{activeChallenge.problemStatement}</h2>
              </div>

              {/* Prompt textarea */}
              <WalletGate>
                <div className="border-2 border-black bg-white">
                  <div className="border-b-2 border-black p-3 flex items-center justify-between">
                    <p className="font-mono font-bold text-sm">YOUR PROMPT</p>
                    <span className="font-mono text-xs text-gray-400">{promptText.length} chars</span>
                  </div>
                  <textarea
                    value={promptText}
                    onChange={e => setPromptText(e.target.value)}
                    rows={10}
                    placeholder="Write your prompt here. Be specific about context, instructions, and expected output format..."
                    className="w-full font-mono text-sm p-4 resize-none outline-none bg-white"
                    disabled={submitting}
                  />
                  <div className="border-t-2 border-black p-3 flex items-center justify-between">
                    <span className="font-mono text-xs text-gray-400">
                      All 4 agents run simultaneously via Promise.all()
                    </span>
                    <button
                      onClick={handleSubmit}
                      disabled={submitting || !promptText.trim()}
                      className="font-mono font-bold text-sm px-6 py-2 bg-purple text-white border-2 border-black shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-x-0 disabled:translate-y-0 disabled:shadow-brutal"
                    >
                      {submitting ? 'EVALUATING...' : 'SUBMIT FOR EVALUATION'}
                    </button>
                  </div>
                </div>
              </WalletGate>

              {/* Error */}
              {error && (
                <div className="border-2 border-red-400 bg-red-50 p-4">
                  <p className="font-mono text-sm text-red-600 font-bold">Error: {error}</p>
                </div>
              )}

              {/* Evaluation loader */}
              {(submitting || evalResult) && (
                <EvaluationLoader
                  isLoading={submitting}
                  result={evalResult}
                  monadScanUrl={monadScanUrl}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
