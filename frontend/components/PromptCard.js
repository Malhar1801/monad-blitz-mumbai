'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '@/context/WalletContext';
import PromptNFTABI from '@/lib/abis/PromptNFT.json';

const MONAD_SCAN = 'https://testnet.monadexplorer.com';

function truncate(addr) {
  if (!addr) return '???';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function weiToMon(wei) {
  try {
    const val = parseFloat(ethers.formatEther(BigInt(wei)));
    return val.toFixed(val < 0.01 ? 6 : 3);
  } catch {
    return '?';
  }
}

export default function PromptCard({ prompt, onBuySuccess }) {
  const { address, getSigner, isCorrectNetwork, switchNetwork, connect } = useWallet();
  const [buyState, setBuyState] = useState('idle'); // idle | pending | confirming | done | error
  const [txHash, setTxHash] = useState(null);
  const [errMsg, setErrMsg] = useState('');

  const {
    tokenId,
    clarityScore,
    structureScore,
    originalityScore,
    outputQualityScore,
    overallScore,
    creatorWallet,
    price,
    isListed,
    ipfsHash,
    problemStatement,
  } = prompt;

  const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_PROMPT_NFT_ADDRESS;

  async function handleBuy() {
    if (!address) { connect(); return; }
    if (!isCorrectNetwork) { await switchNetwork(); return; }

    if (!CONTRACT_ADDRESS) {
      setErrMsg('Contract address not set — restart the dev server after updating .env.local');
      setBuyState('error');
      return;
    }

    setBuyState('pending');
    setTxHash(null);
    setErrMsg('');

    try {
      const signer = await getSigner();
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        PromptNFTABI.abi || PromptNFTABI,
        signer
      );

      const tx = await contract.buyPrompt(tokenId, { value: BigInt(price) });
      setTxHash(tx.hash);
      setBuyState('confirming');

      await tx.wait();
      setBuyState('done');
      onBuySuccess?.();
    } catch (err) {
      const msg = err?.reason || err?.shortMessage || err?.message || 'Unknown error';
      setErrMsg(msg);
      setBuyState('error');
    }
  }

  const scoreBg = overallScore >= 80 ? 'bg-green-400' : overallScore >= 60 ? 'bg-yellow-400' : 'bg-red-400';
  const scoreBorder = overallScore >= 80 ? 'border-green-600' : overallScore >= 60 ? 'border-yellow-600' : 'border-red-600';

  return (
    <div className="border-2 border-black bg-white shadow-brutal hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all flex flex-col group">

      {/* Header row */}
      <div className="border-b-2 border-black p-4 flex items-center justify-between gap-2 bg-cream">
        <span className="font-mono text-xs font-bold px-2 py-1 bg-purple text-white border border-black">
          #{tokenId}
        </span>
        <div className={`font-mono font-black text-xl px-3 py-1 border-2 ${scoreBorder} ${scoreBg}`}>
          {overallScore ?? '—'}
          <span className="text-xs font-normal opacity-60">/100</span>
        </div>
      </div>

      {/* Problem statement */}
      <div className="p-4 flex-1">
        <p className="font-mono text-sm font-bold leading-relaxed line-clamp-3 min-h-[4.5rem]">
          {problemStatement || `Prompt NFT #${tokenId}`}
        </p>

        {/* Score breakdown — C / S / O / Q */}
        <div className="mt-4 flex gap-1">
          {[
            { label: 'C', val: clarityScore, title: 'Clarity' },
            { label: 'S', val: structureScore, title: 'Structure' },
            { label: 'O', val: originalityScore, title: 'Originality' },
            { label: 'Q', val: outputQualityScore, title: 'Output Quality' },
          ].map(({ label, val, title }) => (
            <div
              key={label}
              title={`${title}: ${val}/100`}
              className="flex-1 text-center border-2 border-black p-1 hover:bg-black hover:text-cream transition-colors cursor-default"
            >
              <p className="font-mono text-xs text-gray-500 group-hover:text-gray-400">{label}</p>
              <p className={`font-mono font-bold text-sm ${val >= 80 ? 'text-green-700' : val >= 60 ? 'text-yellow-700' : 'text-red-700'}`}>
                {val ?? '—'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t-2 border-black p-4 space-y-3">
        {/* Creator + price row */}
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-gray-500" title={creatorWallet}>
            by {truncate(creatorWallet)}
          </span>
          <span className="font-mono font-black text-lg">{weiToMon(price)} MON</span>
        </div>

        {/* IPFS link */}
        {ipfsHash && (
          <a
            href={`https://gateway.pinata.cloud/ipfs/${ipfsHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs text-purple underline underline-offset-2 block hover:text-black transition-colors"
          >
            ↗ view full metadata on IPFS
          </a>
        )}

        {/* Buy status messages */}
        {buyState === 'confirming' && txHash && (
          <a
            href={`${MONAD_SCAN}/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 border-2 border-black bg-yellow-100 px-3 py-2 hover:bg-yellow-200 transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-yellow-400 border border-black animate-pulse flex-shrink-0" />
            <span className="font-mono text-xs font-bold flex-1">Confirming on Monad...</span>
            <span className="font-mono text-xs text-purple font-bold">VIEW TX ↗</span>
          </a>
        )}

        {buyState === 'done' && txHash && (
          <a
            href={`${MONAD_SCAN}/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 border-2 border-black bg-green-100 px-3 py-2 hover:bg-green-200 transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-green-400 border border-black flex-shrink-0" />
            <span className="font-mono text-xs font-bold flex-1">✓ Purchased! Prompt #{tokenId} is yours</span>
            <span className="font-mono text-xs text-purple font-bold">MONADSCAN ↗</span>
          </a>
        )}

        {buyState === 'error' && (
          <div className="border-2 border-red-400 bg-red-50 px-3 py-2">
            <p className="font-mono text-xs text-red-600 font-bold">✗ {errMsg}</p>
          </div>
        )}

        {/* Buy button */}
        <button
          onClick={handleBuy}
          disabled={!isListed || buyState === 'pending' || buyState === 'confirming' || buyState === 'done'}
          className="w-full font-mono font-bold text-sm py-2.5 border-2 border-black bg-black text-cream hover:bg-purple disabled:opacity-40 disabled:cursor-not-allowed shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
        >
          {!address
            ? 'CONNECT TO BUY'
            : buyState === 'pending'
            ? 'WAITING FOR WALLET...'
            : buyState === 'confirming'
            ? 'CONFIRMING ON MONAD...'
            : buyState === 'done'
            ? '✓ PURCHASED'
            : !isListed
            ? 'NOT LISTED'
            : 'BUY WITH WALLET →'}
        </button>
      </div>
    </div>
  );
}
