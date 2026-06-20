'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import PromptCard from '@/components/PromptCard';
import { getMarketplace } from '@/lib/api';

const TAGS = ['ERC-721', 'AI-VERIFIED', 'ON-CHAIN SCORES', 'MONAD TESTNET'];

const STATS = [
  { top: '4 AI AGENTS', bottom: 'PER PROMPT' },
  { top: '100% ON-CHAIN', bottom: 'SCORES' },
  { top: '<2s EVAL TIME', bottom: 'PER PROMPT' },
  { top: '∞ CHALLENGES', bottom: 'TO PRACTICE' },
];

const CREATOR_STEPS = [
  { n: '01', label: 'CONNECT WALLET', desc: 'Link your MetaMask to Monad testnet' },
  { n: '02', label: 'PICK A CHALLENGE', desc: 'Browse on-chain prompt challenges by category' },
  { n: '03', label: 'WRITE YOUR PROMPT', desc: 'Craft your solution to the problem statement' },
  { n: '04', label: '4 AGENTS EVALUATE', desc: 'Clarity · Structure · Originality · Output Quality' },
  { n: '05', label: 'SCORE LOGGED ON-CHAIN', desc: 'Your attempt is recorded to TrainingRegistry' },
  { n: '06', label: 'REACH 75 AVG → EXPERT', desc: 'Expert status unlocks NFT minting rights' },
];

const BUYER_STEPS = [
  { n: '01', label: 'DESCRIBE YOUR NEED', desc: 'Type what you need in plain English' },
  { n: '02', label: 'FILTER AGENT SEARCHES', desc: 'Semantic similarity × quality score ranking' },
  { n: '03', label: 'SEE TOP 3 MATCHES', desc: 'Ranked results with full score breakdown' },
  { n: '04', label: 'BUY WITH METAMASK', desc: 'Sign the buyPrompt tx — NFT transfers instantly' },
  { n: '05', label: 'OWN THE PROMPT', desc: 'ERC-721 in your wallet, usable forever' },
];

const AGENTS = [
  { icon: '◎', name: 'CLARITY AGENT', desc: 'Checks goal specificity and ambiguity. Does an AI know exactly what to do?', weight: '25%' },
  { icon: '▦', name: 'STRUCTURE AGENT', desc: 'Evaluates context, step-by-step instructions, output format, and constraints.', weight: '25%' },
  { icon: '⬡', name: 'ORIGINALITY AGENT', desc: 'Embeds and compares against all minted prompts. Flags plagiarism via cosine similarity.', weight: '25%' },
  { icon: '▶', name: 'OUTPUT QUALITY AGENT', desc: 'Actually runs the prompt, then judges the output for usefulness and commercial value.', weight: '25%' },
];

const COMPARISON = [
  { aspect: 'WHAT YOU PRACTICE', lc: 'Algorithms & data structures', pf: 'Prompt engineering' },
  { aspect: 'PROOF OF SKILL', lc: 'Acceptance rate badge', pf: 'On-chain score (immutable)' },
  { aspect: 'MONETIZATION', lc: 'Job applications', pf: 'Sell prompts as NFTs' },
  { aspect: 'EVALUATION', lc: 'Test cases pass/fail', pf: '4 AI agents, multi-dimensional' },
  { aspect: 'OWNERSHIP', lc: 'Profile on their platform', pf: 'ERC-721 in your wallet' },
];

export default function LandingPage() {
  const [previews, setPreviews] = useState([]);

  useEffect(() => {
    getMarketplace().then(d => setPreviews((d.listings || []).slice(0, 3))).catch(() => {});
  }, []);

  return (
    <div className="bg-cream">
      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-16">
        {/* Tag badges */}
        <div className="flex flex-wrap gap-2 mb-8">
          {TAGS.map(t => (
            <span key={t} className="font-mono text-xs font-bold px-3 py-1 border-2 border-black bg-white shadow-brutal-sm">
              {t}
            </span>
          ))}
        </div>

        {/* H1 */}
        <h1 className="font-mono font-black text-5xl md:text-6xl leading-tight tracking-tight text-black max-w-5xl mb-6">
          THE MARKETPLACE WHERE PROMPTS ARE PROVEN,{' '}
          <span className="text-purple">NOT JUST POSTED.</span>
        </h1>

        <p className="font-mono text-lg text-gray-600 max-w-2xl mb-10 leading-relaxed">
          Train. Evaluate. Verify. Sell.{' '}
          <span className="text-black font-bold">Every prompt is scored by 4 AI agents</span> before it reaches buyers.
          Skills logged on Monad testnet — immutable, verifiable, yours.
        </p>

        <div className="flex flex-wrap gap-4">
          <Link
            href="/marketplace"
            className="font-mono font-black text-base px-8 py-4 bg-black text-cream border-2 border-black shadow-brutal hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all"
          >
            EXPLORE MARKETPLACE
          </Link>
          <Link
            href="/training"
            className="font-mono font-black text-base px-8 py-4 bg-purple text-white border-2 border-black shadow-brutal hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all"
          >
            START TRAINING →
          </Link>
        </div>
      </section>

      {/* ── STATS BAR ─────────────────────────────────────────────────────── */}
      <section className="border-y-3 border-black bg-black">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 divide-x-2 divide-gray-700">
          {STATS.map((s, i) => (
            <div key={i} className="p-6 text-center">
              <p className="font-mono font-black text-xl text-cream">{s.top}</p>
              <p className="font-mono text-xs text-gray-400 mt-1">{s.bottom}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="mb-10">
          <span className="font-mono text-xs font-bold px-3 py-1 border-2 border-black bg-purple text-white">
            ARCHITECTURE FLOW
          </span>
        </div>
        <div className="grid md:grid-cols-2 gap-0 border-2 border-black">
          {/* Creator path */}
          <div className="border-r-0 md:border-r-2 border-black">
            <div className="border-b-2 border-black p-4 bg-black">
              <p className="font-mono font-black text-cream">CREATOR PATH</p>
              <p className="font-mono text-xs text-gray-400">Train → Expert → Mint → Earn</p>
            </div>
            <div className="divide-y-2 divide-black">
              {CREATOR_STEPS.map((s) => (
                <div key={s.n} className="p-4 flex gap-4 hover:bg-purple hover:text-white transition-colors group">
                  <span className="font-mono font-black text-2xl text-purple group-hover:text-cream w-10 flex-shrink-0">{s.n}</span>
                  <div>
                    <p className="font-mono font-bold text-sm">{s.label}</p>
                    <p className="font-mono text-xs text-gray-500 group-hover:text-purple-200 mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Buyer path */}
          <div>
            <div className="border-b-2 border-black p-4 bg-purple">
              <p className="font-mono font-black text-white">BUYER PATH</p>
              <p className="font-mono text-xs text-purple-200">Search → Find → Buy → Own</p>
            </div>
            <div className="divide-y-2 divide-black">
              {BUYER_STEPS.map((s) => (
                <div key={s.n} className="p-4 flex gap-4 hover:bg-black hover:text-white transition-colors group">
                  <span className="font-mono font-black text-2xl text-black group-hover:text-purple w-10 flex-shrink-0">{s.n}</span>
                  <div>
                    <p className="font-mono font-bold text-sm">{s.label}</p>
                    <p className="font-mono text-xs text-gray-500 group-hover:text-gray-300 mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 4 AGENTS ──────────────────────────────────────────────────────── */}
      <section className="bg-black py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10">
            <span className="font-mono text-xs font-bold px-3 py-1 border-2 border-purple bg-purple text-white">
              EVALUATION ENGINE
            </span>
            <h2 className="font-mono font-black text-4xl text-cream mt-4">
              4 AGENTS. 1 VERDICT.
            </h2>
            <p className="font-mono text-gray-400 mt-2">All run in parallel via Promise.all(). Total wait = slowest agent.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {AGENTS.map((a) => (
              <div key={a.name} className="border-2 border-gray-700 p-6 hover:border-purple transition-colors group">
                <div className="flex items-center gap-4 mb-4">
                  <span className="font-mono text-3xl text-purple w-12 h-12 border-2 border-purple flex items-center justify-center">
                    {a.icon}
                  </span>
                  <div>
                    <p className="font-mono font-black text-cream">{a.name}</p>
                    <span className="font-mono text-xs text-gray-500 px-2 py-0.5 border border-gray-600">
                      weight: {a.weight}
                    </span>
                  </div>
                </div>
                <p className="font-mono text-sm text-gray-400 leading-relaxed">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPARISON ────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="mb-10">
          <span className="font-mono text-xs font-bold px-3 py-1 border-2 border-black bg-cream">
            WHY PROMPTFI
          </span>
          <h2 className="font-mono font-black text-4xl mt-4">
            SHARPEN YOUR SKILL.<br />
            <span className="text-purple">PROVE IT ON-CHAIN.</span>
          </h2>
        </div>
        <div className="border-2 border-black overflow-hidden">
          <div className="grid grid-cols-3 border-b-2 border-black bg-black text-cream">
            <div className="p-4 font-mono text-xs font-bold border-r-2 border-gray-700">ASPECT</div>
            <div className="p-4 font-mono text-xs font-bold border-r-2 border-gray-700">LEETCODE</div>
            <div className="p-4 font-mono text-xs font-bold text-purple">PROMPTFI</div>
          </div>
          {COMPARISON.map((row, i) => (
            <div key={i} className={`grid grid-cols-3 border-b-2 border-black last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-cream'}`}>
              <div className="p-4 font-mono text-xs font-bold border-r-2 border-black">{row.aspect}</div>
              <div className="p-4 font-mono text-xs text-gray-500 border-r-2 border-black">{row.lc}</div>
              <div className="p-4 font-mono text-xs font-bold text-purple">{row.pf}</div>
            </div>
          ))}
        </div>
        <div className="mt-8">
          <Link
            href="/training"
            className="font-mono font-black text-sm px-6 py-3 bg-purple text-white border-2 border-black shadow-brutal hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all inline-block"
          >
            START A CHALLENGE →
          </Link>
        </div>
      </section>

      {/* ── MARKETPLACE PREVIEW ───────────────────────────────────────────── */}
      <section className="border-t-2 border-black py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <span className="font-mono text-xs font-bold px-3 py-1 border-2 border-black bg-black text-cream">
                LIVE MARKETPLACE
              </span>
              <h2 className="font-mono font-black text-4xl mt-4">VERIFIED PROMPTS FOR SALE.</h2>
            </div>
            <Link
              href="/marketplace"
              className="font-mono font-bold text-sm px-5 py-2 border-2 border-black hover:bg-black hover:text-cream transition-colors"
            >
              BROWSE ALL →
            </Link>
          </div>

          {previews.length === 0 ? (
            <div className="border-2 border-black p-12 text-center bg-white">
              <p className="font-mono text-gray-400">No listings yet. Be the first to mint a prompt.</p>
              <Link href="/training" className="font-mono font-bold text-sm mt-4 inline-block text-purple underline">
                Start training →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {previews.map(p => (
                <PromptCard key={p.tokenId} prompt={p} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="border-t-3 border-black bg-black py-8 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <p className="font-mono text-sm text-gray-400">
            <span className="text-cream font-bold">PromptFi</span> — Built on Monad Testnet
          </p>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs text-gray-500 hover:text-purple transition-colors"
          >
            GitHub ↗
          </a>
        </div>
      </footer>
    </div>
  );
}
