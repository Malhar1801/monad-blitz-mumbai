'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@/context/WalletContext';
import EvaluationLoader from '@/components/EvaluationLoader';
import { getTrainingProgress, mintPrompt } from '@/lib/api';

const CATEGORIES = [
  'Technical Writing',
  'Debugging',
  'Creative Writing',
  'Code Generation',
  'Testing',
  'Data Analysis',
  'Content Generation',
  'Other',
];

function WalletGate({ children }) {
  const { address, connect } = useWallet();
  if (address) return children;
  return (
    <div className="border-2 border-black p-12 text-center bg-white">
      <p className="font-mono font-black text-xl mb-2">WALLET NOT CONNECTED</p>
      <p className="font-mono text-sm text-gray-500 mb-6">Connect your wallet to check Expert status and mint prompts.</p>
      <button
        onClick={connect}
        className="font-mono font-bold text-sm px-6 py-3 bg-purple text-white border-2 border-black shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
      >
        CONNECT WALLET
      </button>
    </div>
  );
}

export default function MintPage() {
  const { address } = useWallet();

  const [progress, setProgress] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(true);

  const [form, setForm] = useState({ problemStatement: '', category: CATEGORIES[0], promptText: '', price: '0.01' });
  const [submitting, setSubmitting] = useState(false);
  const [evalResult, setEvalResult] = useState(null);
  const [mintSuccess, setMintSuccess] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!address) { setLoadingProgress(false); return; }
    setLoadingProgress(true);
    getTrainingProgress(address)
      .then(d => setProgress(d))
      .catch(() => {})
      .finally(() => setLoadingProgress(false));
  }, [address]);

  async function handleMint() {
    if (!form.problemStatement.trim() || !form.promptText.trim()) return;
    setSubmitting(true);
    setEvalResult(null);
    setMintSuccess(null);
    setError('');
    try {
      const data = await mintPrompt(
        address,
        form.promptText.trim(),
        form.problemStatement.trim(),
        form.category,
        form.price
      );
      setEvalResult(data.evaluation);
      if (data.success) {
        setMintSuccess({ tokenId: data.tokenId, ipfsHash: data.ipfsHash });
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  const update = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  // ── Not connected ──────────────────────────────────────────────────────────
  if (!address) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <span className="font-mono text-xs font-bold px-3 py-1 border-2 border-black bg-black text-cream">MINT</span>
          <h1 className="font-mono font-black text-4xl mt-4">MINT YOUR PROMPT.</h1>
        </div>
        <WalletGate><></></WalletGate>
      </div>
    );
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loadingProgress) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="border-2 border-black p-8 text-center bg-white">
          <p className="font-mono text-sm text-gray-400 animate-pulse">Checking expert status on-chain...</p>
        </div>
      </div>
    );
  }

  const isExpert = progress?.isExpert ?? false;
  const avgScore = progress?.averageScore ?? 0;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-8">
        <span className="font-mono text-xs font-bold px-3 py-1 border-2 border-black bg-black text-cream">MINT</span>
        <h1 className="font-mono font-black text-4xl mt-4">MINT YOUR PROMPT.</h1>
        <p className="font-mono text-gray-500 mt-2">Expert-only. 4 agents evaluate first. Score ≥ 70 required to mint.</p>
      </div>

      {/* ── LOCKED STATE ──────────────────────────────────────────────────── */}
      {!isExpert && (
        <div className="border-3 border-black bg-cream">
          <div className="border-b-2 border-black p-5 bg-black flex items-center gap-3">
            <span className="font-mono text-2xl text-yellow-400">⚠</span>
            <p className="font-mono font-black text-cream">EXPERT STATUS REQUIRED</p>
          </div>
          <div className="p-8">
            <p className="font-mono text-lg font-bold mb-4">
              Average score of <span className="text-purple">75+</span> required to unlock minting.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="border-2 border-black p-4 bg-white text-center">
                <p className="font-mono font-black text-4xl">{avgScore}</p>
                <p className="font-mono text-xs text-gray-500">YOUR AVERAGE</p>
              </div>
              <div className="border-2 border-purple p-4 bg-white text-center">
                <p className="font-mono font-black text-4xl text-purple">75</p>
                <p className="font-mono text-xs text-gray-500">REQUIRED</p>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex justify-between mb-1">
                <span className="font-mono text-xs text-gray-500">Progress to Expert</span>
                <span className="font-mono text-xs font-bold">{avgScore} / 75</span>
              </div>
              <div className="w-full h-4 bg-gray-200 border-2 border-black overflow-hidden">
                <div
                  className="h-full bg-purple transition-all duration-700"
                  style={{ width: `${Math.min((avgScore / 75) * 100, 100)}%` }}
                />
              </div>
            </div>

            <p className="font-mono text-sm text-gray-600 mb-6">
              Complete training challenges and raise your average score to unlock minting.
              Each attempt is logged immutably on Monad testnet.
            </p>

            <Link
              href="/training"
              className="font-mono font-black text-sm px-6 py-3 bg-purple text-white border-2 border-black shadow-brutal hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all inline-block"
            >
              GO TO TRAINING →
            </Link>
          </div>
        </div>
      )}

      {/* ── MINT FORM ─────────────────────────────────────────────────────── */}
      {isExpert && (
        <div className="space-y-4">
          {/* Expert badge */}
          <div className="border-2 border-green-400 bg-green-50 p-4 flex items-center gap-3">
            <span className="font-mono font-black text-green-600 text-lg">★ EXPERT</span>
            <p className="font-mono text-sm text-green-700">
              Your avg score ({avgScore}/100) qualifies you to mint. NFT will be minted to your wallet on Monad.
            </p>
          </div>

          {/* Form */}
          <div className="border-2 border-black bg-white">
            <div className="border-b-2 border-black p-4 bg-black">
              <p className="font-mono font-black text-cream">PROMPT DETAILS</p>
            </div>

            <div className="p-5 space-y-5">
              {/* Problem statement */}
              <div>
                <label className="font-mono text-xs font-bold block mb-2">PROBLEM STATEMENT *</label>
                <textarea
                  value={form.problemStatement}
                  onChange={update('problemStatement')}
                  rows={3}
                  placeholder="What problem does this prompt solve? This is what buyers search for..."
                  className="w-full font-mono text-sm p-3 border-2 border-black outline-none focus:border-purple resize-none"
                  disabled={submitting}
                />
              </div>

              {/* Category */}
              <div>
                <label className="font-mono text-xs font-bold block mb-2">CATEGORY *</label>
                <select
                  value={form.category}
                  onChange={update('category')}
                  className="w-full font-mono text-sm p-3 border-2 border-black outline-none focus:border-purple bg-white"
                  disabled={submitting}
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Prompt text */}
              <div>
                <label className="font-mono text-xs font-bold block mb-2">PROMPT TEXT *</label>
                <textarea
                  value={form.promptText}
                  onChange={update('promptText')}
                  rows={10}
                  placeholder="Write your complete prompt here. This is what gets minted and sold as the NFT..."
                  className="w-full font-mono text-sm p-3 border-2 border-black outline-none focus:border-purple resize-none"
                  disabled={submitting}
                />
                <p className="font-mono text-xs text-gray-400 mt-1">{form.promptText.length} chars</p>
              </div>

              {/* Price */}
              <div>
                <label className="font-mono text-xs font-bold block mb-2">LISTING PRICE (MON) *</label>
                <div className="flex items-center border-2 border-black overflow-hidden">
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    value={form.price}
                    onChange={update('price')}
                    className="flex-1 font-mono text-sm p-3 outline-none bg-white"
                    disabled={submitting}
                  />
                  <span className="font-mono font-bold text-sm px-4 py-3 bg-black text-cream border-l-2 border-black">MON</span>
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={handleMint}
                disabled={submitting || !form.problemStatement.trim() || !form.promptText.trim()}
                className="w-full font-mono font-black text-base py-4 bg-purple text-white border-2 border-black shadow-brutal hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-x-0 disabled:translate-y-0 disabled:shadow-brutal"
              >
                {submitting ? 'EVALUATING & MINTING...' : 'EVALUATE & MINT →'}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="border-2 border-red-400 bg-red-50 p-4">
              <p className="font-mono font-bold text-sm text-red-600">Error: {error}</p>
              <p className="font-mono text-xs text-red-500 mt-1">If score was too low, check the evaluation below for feedback.</p>
            </div>
          )}

          {/* Evaluation loader */}
          {(submitting || evalResult) && (
            <EvaluationLoader isLoading={submitting} result={evalResult} />
          )}

          {/* Mint success */}
          {mintSuccess && (
            <div className="border-2 border-green-400 bg-green-50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="font-mono text-2xl">✓</span>
                <p className="font-mono font-black text-xl text-green-700">MINTED SUCCESSFULLY!</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="border-2 border-black p-3 bg-white">
                  <p className="font-mono text-xs text-gray-500">TOKEN ID</p>
                  <p className="font-mono font-black text-2xl">#{mintSuccess.tokenId}</p>
                </div>
                <div className="border-2 border-black p-3 bg-white">
                  <p className="font-mono text-xs text-gray-500">IPFS METADATA</p>
                  <a
                    href={`https://ipfs.io/ipfs/${mintSuccess.ipfsHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-purple underline break-all"
                  >
                    {mintSuccess.ipfsHash?.slice(0, 20)}...
                  </a>
                </div>
              </div>
              <Link
                href="/marketplace"
                className="font-mono font-bold text-sm mt-4 inline-block text-purple underline"
              >
                View in marketplace →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
