'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { getAccount } from '@/lib/api';
import { ethers } from 'ethers';
import Link from 'next/link';

const MONAD_SCAN = 'https://testnet.monadexplorer.com';

function truncate(addr) {
  if (!addr) return '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function weiToMon(wei) {
  try {
    const val = parseFloat(ethers.formatEther(BigInt(wei)));
    return val.toFixed(val < 0.01 ? 6 : 3);
  } catch { return '?'; }
}

// ── Mini NFT card ─────────────────────────────────────────────────────────────
function NftCard({ token, badge }) {
  const scoreBg = token.overallScore >= 80 ? 'bg-green-400' : token.overallScore >= 60 ? 'bg-yellow-400' : 'bg-red-400';
  return (
    <div className="border-2 border-black bg-white p-4 flex flex-col gap-3 hover:shadow-brutal transition-all hover:translate-x-[2px] hover:translate-y-[2px]">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs font-bold px-2 py-0.5 bg-purple text-white border border-black">#{token.tokenId}</span>
        <div className="flex items-center gap-2">
          {badge && <span className="font-mono text-xs font-bold px-2 py-0.5 border-2 border-black bg-black text-cream">{badge}</span>}
          <span className={`font-mono font-black text-lg px-2 py-0.5 border-2 border-black ${scoreBg}`}>{token.overallScore}</span>
        </div>
      </div>
      <p className="font-mono text-xs font-bold leading-relaxed line-clamp-2 min-h-[2.5rem]">
        {token.problemStatement}
      </p>
      <div className="flex gap-1">
        {[
          { l: 'C', v: token.clarityScore },
          { l: 'S', v: token.structureScore },
          { l: 'O', v: token.originalityScore },
          { l: 'Q', v: token.outputQualityScore },
        ].map(({ l, v }) => (
          <div key={l} className="flex-1 text-center border border-black p-1">
            <p className="font-mono text-xs text-gray-400">{l}</p>
            <p className={`font-mono font-bold text-xs ${v >= 80 ? 'text-green-700' : v >= 60 ? 'text-yellow-700' : 'text-red-700'}`}>{v}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-black pt-2">
        <span className="font-mono text-xs text-gray-500">{weiToMon(token.price)} MON</span>
        <a
          href={`https://gateway.pinata.cloud/ipfs/${token.ipfsHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-xs text-purple underline hover:text-black"
        >
          IPFS ↗
        </a>
      </div>
    </div>
  );
}

// ── Stat box ──────────────────────────────────────────────────────────────────
function StatBox({ label, value, sub }) {
  return (
    <div className="border-2 border-black bg-white p-4 text-center">
      <p className="font-mono font-black text-4xl">{value}</p>
      {sub && <p className="font-mono text-xs text-purple font-bold">{sub}</p>}
      <p className="font-mono text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ title, count, icon }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="font-mono font-black text-2xl">{icon}</span>
      <h2 className="font-mono font-black text-xl">{title}</h2>
      {count !== undefined && (
        <span className="font-mono text-xs font-bold px-2 py-0.5 border-2 border-black bg-black text-cream ml-auto">{count}</span>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AccountPage() {
  const { address, connect } = useWallet();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [tab,     setTab]     = useState('owned'); // owned | minted | purchased

  useEffect(() => {
    if (!address) return;
    setLoading(true);
    setError('');
    getAccount(address)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [address]);

  if (!address) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center">
        <p className="font-mono text-5xl mb-6">◎</p>
        <h1 className="font-mono font-black text-3xl mb-3">YOUR ACCOUNT</h1>
        <p className="font-mono text-gray-500 mb-8">Connect your wallet to see your prompts, training history, and on-chain activity.</p>
        <button
          onClick={connect}
          className="font-mono font-bold text-sm px-8 py-3 bg-black text-cream border-2 border-black shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none hover:bg-purple transition-all"
        >
          CONNECT WALLET
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">

      {/* ── Page Header ── */}
      <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <span className="font-mono text-xs font-bold px-3 py-1 border-2 border-black bg-black text-cream">MY ACCOUNT</span>
          <h1 className="font-mono font-black text-3xl mt-4 break-all">{address}</h1>
          <div className="flex items-center gap-3 mt-2">
            <a
              href={`${MONAD_SCAN}/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs text-purple underline hover:text-black"
            >
              View on MonadScan ↗
            </a>
            <a
              href={`${MONAD_SCAN}/address/${address}?tab=txs`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs text-purple underline hover:text-black"
            >
              Transaction History ↗
            </a>
          </div>
        </div>
        {data?.training?.isExpert && (
          <div className="border-2 border-black bg-purple text-white px-4 py-2 font-mono font-black text-sm shadow-brutal">
            ★ EXPERT STATUS
          </div>
        )}
      </div>

      {loading && (
        <div className="border-2 border-black bg-white p-12 text-center">
          <div className="w-4 h-4 border-2 border-black border-t-purple animate-spin mx-auto mb-4" />
          <p className="font-mono text-sm text-gray-500">Loading on-chain data from Monad...</p>
        </div>
      )}

      {error && (
        <div className="border-2 border-red-400 bg-red-50 p-4 mb-6">
          <p className="font-mono text-sm text-red-600 font-bold">Error: {error}</p>
        </div>
      )}

      {data && (
        <>
          {/* ── Stats Row ── */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-10">
            <StatBox label="AVG SCORE" value={data.training.averageScore} sub={data.training.isExpert ? '★ EXPERT' : null} />
            <StatBox label="CHALLENGES DONE" value={data.training.attemptCount} />
            <StatBox label="PROMPTS MINTED" value={data.stats.minted} />
            <StatBox label="PROMPTS BOUGHT" value={data.stats.purchased} />
            <StatBox label="TOTAL OWNED" value={data.stats.owned} />
          </div>

          {/* ── Training Progress ── */}
          <div className="mb-10 border-2 border-black bg-white p-6">
            <SectionHeader title="TRAINING PROGRESS" icon="◎" />
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs text-gray-500">Progress to Expert (avg ≥ 75)</span>
              <span className="font-mono text-xs font-bold">{data.training.averageScore} / 75</span>
            </div>
            <div className="w-full h-4 bg-gray-200 border-2 border-black overflow-hidden mb-3">
              <div
                className="h-full bg-purple transition-all duration-700 relative"
                style={{ width: `${Math.min(data.training.progressToExpert, 100)}%` }}
              >
                {data.training.progressToExpert >= 20 && (
                  <span className="absolute right-2 top-0 bottom-0 flex items-center font-mono text-xs text-white font-bold">
                    {Math.round(data.training.progressToExpert)}%
                  </span>
                )}
              </div>
            </div>
            {data.training.isExpert ? (
              <p className="font-mono text-xs text-green-600 font-bold">✓ Expert status active — you can mint prompts!</p>
            ) : (
              <div className="flex items-center justify-between">
                <p className="font-mono text-xs text-gray-500">{Math.max(0, 75 - data.training.averageScore)} pts to Expert</p>
                <Link href="/training" className="font-mono text-xs font-bold text-purple underline hover:text-black">
                  KEEP TRAINING →
                </Link>
              </div>
            )}
          </div>

          {/* ── NFT Tabs ── */}
          <div className="mb-6">
            <SectionHeader title="MY PROMPTS" icon="▦" />

            {/* Tab switcher */}
            <div className="flex border-2 border-black mb-6">
              {[
                { key: 'owned',     label: `ALL OWNED (${data.stats.owned})` },
                { key: 'minted',    label: `MINTED BY ME (${data.stats.minted})` },
                { key: 'purchased', label: `PURCHASED (${data.stats.purchased})` },
              ].map(({ key, label }, i) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`flex-1 font-mono font-bold text-xs py-3 transition-colors ${i > 0 ? 'border-l-2 border-black' : ''} ${
                    tab === key ? 'bg-black text-cream' : 'bg-white text-black hover:bg-purple hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Grid */}
            {(() => {
              const list = tab === 'minted' ? data.minted : tab === 'purchased' ? data.purchased : data.allOwned;
              const badgeMap = { minted: 'MINTED', purchased: 'BOUGHT', owned: null };
              if (list.length === 0) {
                return (
                  <div className="border-2 border-black p-12 text-center bg-white">
                    <p className="font-mono text-gray-400">
                      {tab === 'minted'    ? 'No prompts minted yet. Train to Expert and mint your first prompt.' :
                       tab === 'purchased' ? 'No purchased prompts yet. Browse the marketplace.' :
                       'No prompts owned yet.'}
                    </p>
                    <Link
                      href={tab === 'minted' ? '/training' : '/marketplace'}
                      className="font-mono text-xs font-bold mt-4 inline-block text-purple underline hover:text-black"
                    >
                      {tab === 'minted' ? 'GO TRAIN →' : 'GO TO MARKETPLACE →'}
                    </Link>
                  </div>
                );
              }
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {list.map(token => (
                    <NftCard
                      key={token.tokenId}
                      token={token}
                      badge={tab === 'owned' ? (token.creatorWallet?.toLowerCase() === address?.toLowerCase() ? 'MINTED' : 'BOUGHT') : null}
                    />
                  ))}
                </div>
              );
            })()}
          </div>

          {/* ── On-chain links ── */}
          <div className="mt-10 border-2 border-black grid grid-cols-1 md:grid-cols-3 divide-y-2 md:divide-y-0 md:divide-x-2 divide-black bg-black text-cream">
            <a
              href={`${MONAD_SCAN}/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-5 hover:bg-purple transition-colors flex items-center justify-between"
            >
              <div>
                <p className="font-mono font-black text-sm">ADDRESS</p>
                <p className="font-mono text-xs text-gray-400 mt-1">{truncate(address)}</p>
              </div>
              <span className="text-purple text-xl">↗</span>
            </a>
            <a
              href={`${MONAD_SCAN}/address/${address}?tab=txs`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-5 hover:bg-purple transition-colors flex items-center justify-between"
            >
              <div>
                <p className="font-mono font-black text-sm">TRANSACTION HISTORY</p>
                <p className="font-mono text-xs text-gray-400 mt-1">All on-chain activity</p>
              </div>
              <span className="text-purple text-xl">↗</span>
            </a>
            <a
              href={`${MONAD_SCAN}/address/${address}?tab=tokens`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-5 hover:bg-purple transition-colors flex items-center justify-between"
            >
              <div>
                <p className="font-mono font-black text-sm">NFT TOKENS</p>
                <p className="font-mono text-xs text-gray-400 mt-1">All owned NFTs on Monad</p>
              </div>
              <span className="text-purple text-xl">↗</span>
            </a>
          </div>
        </>
      )}
    </div>
  );
}
