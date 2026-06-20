'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useWallet } from '@/context/WalletContext';
import { ethers } from 'ethers';

const MONAD_SCAN = 'https://testnet.monadexplorer.com';

function truncate(addr) {
  if (!addr) return '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function WalletPanel({ address, isCorrectNetwork, balance, onDisconnect, onSwitchNetwork, onClose }) {
  const copied = useRef(false);
  const [copyLabel, setCopyLabel] = useState('COPY');

  function copyAddress() {
    navigator.clipboard.writeText(address);
    setCopyLabel('COPIED!');
    setTimeout(() => setCopyLabel('COPY'), 1500);
  }

  return (
    <div className="absolute top-full right-0 mt-2 w-80 bg-white border-2 border-black shadow-brutal z-50 font-mono">
      {/* Header */}
      <div className="border-b-2 border-black p-4 bg-black text-cream">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-gray-400">CONNECTED WALLET</span>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-lg leading-none">×</button>
        </div>
        <div className="flex items-center gap-2 mt-2">
          {/* Blockie-style avatar */}
          <div
            className="w-8 h-8 border-2 border-purple flex-shrink-0"
            style={{ background: `linear-gradient(135deg, #7c3aed ${address.charCodeAt(2) % 60}%, #000 100%)` }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{address}</p>
          </div>
        </div>
      </div>

      {/* Network badge */}
      <div className="border-b-2 border-black px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full border border-black ${isCorrectNetwork ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className="text-xs font-bold">{isCorrectNetwork ? 'Monad Testnet' : 'Wrong Network'}</span>
        </div>
        {!isCorrectNetwork && (
          <button
            onClick={onSwitchNetwork}
            className="text-xs font-bold px-2 py-1 bg-yellow-400 border border-black hover:bg-yellow-300 transition-colors"
          >
            SWITCH →
          </button>
        )}
      </div>

      {/* Balance */}
      <div className="border-b-2 border-black px-4 py-3">
        <p className="text-xs text-gray-500 mb-1">BALANCE</p>
        <p className="text-2xl font-black">{balance ?? '...'} <span className="text-sm font-normal text-gray-500">MON</span></p>
      </div>

      {/* Actions */}
      <div className="border-b-2 border-black divide-y-2 divide-black">
        <Link
          href="/account"
          onClick={onClose}
          className="w-full text-left px-4 py-3 text-xs font-bold hover:bg-purple hover:text-white transition-colors flex items-center justify-between"
        >
          <span>👤 My Account & History</span>
          <span className="opacity-60">→</span>
        </Link>
        <button
          onClick={copyAddress}
          className="w-full text-left px-4 py-3 text-xs font-bold hover:bg-purple hover:text-white transition-colors flex items-center justify-between"
        >
          <span>📋 {truncate(address)}</span>
          <span className="text-xs opacity-60">{copyLabel}</span>
        </button>
        <a
          href={`${MONAD_SCAN}/address/${address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full text-left px-4 py-3 text-xs font-bold hover:bg-purple hover:text-white transition-colors flex items-center justify-between"
        >
          <span>🔗 View on MonadScan</span>
          <span className="opacity-60">↗</span>
        </a>
        <a
          href={`${MONAD_SCAN}/address/${address}?tab=txs`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full text-left px-4 py-3 text-xs font-bold hover:bg-purple hover:text-white transition-colors flex items-center justify-between"
        >
          <span>📜 Transaction History</span>
          <span className="opacity-60">↗</span>
        </a>
      </div>

      {/* Disconnect */}
      <button
        onClick={() => { onDisconnect(); onClose(); }}
        className="w-full px-4 py-3 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
      >
        <span>⏻</span>
        <span>DISCONNECT WALLET</span>
      </button>
    </div>
  );
}

export default function Navbar() {
  const { address, isConnecting, isCorrectNetwork, connect, disconnect, switchNetwork, provider } = useWallet();
  const [panelOpen, setPanelOpen] = useState(false);
  const [balance, setBalance] = useState(null);
  const panelRef = useRef(null);

  // Fetch MON balance when connected
  useEffect(() => {
    if (!address || !provider) { setBalance(null); return; }
    provider.getBalance(address).then((bal) => {
      const formatted = parseFloat(ethers.formatEther(bal)).toFixed(4);
      setBalance(formatted);
    }).catch(() => setBalance('?'));
  }, [address, provider]);

  // Close panel on outside click
  useEffect(() => {
    function handleClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setPanelOpen(false);
      }
    }
    if (panelOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [panelOpen]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-cream border-b-2 border-black">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="font-mono font-black text-xl tracking-tight text-black hover:text-purple transition-colors">
          PromptFi
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-0 border-2 border-black">
          {[
            { label: 'MARKETPLACE', href: '/marketplace' },
            { label: 'TRAIN', href: '/training' },
            { label: 'MINT', href: '/mint' },
            { label: 'ACCOUNT', href: '/account' },
          ].map((link, i) => (
            <Link
              key={link.href}
              href={link.href}
              className={`font-mono font-bold text-sm px-5 py-2 text-black hover:bg-purple hover:text-white transition-colors ${i > 0 ? 'border-l-2 border-black' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Wallet area */}
        <div className="flex items-center gap-2">
          {/* Wrong network warning */}
          {address && !isCorrectNetwork && (
            <button
              onClick={switchNetwork}
              className="font-mono text-xs font-bold px-3 py-1.5 bg-yellow-400 border-2 border-black shadow-brutal-sm hover:translate-x-px hover:translate-y-px hover:shadow-none transition-all"
            >
              ⚠ SWITCH TO MONAD
            </button>
          )}

          {/* Connected: show address button + dropdown panel */}
          {address ? (
            <div className="relative" ref={panelRef}>
              <button
                onClick={() => setPanelOpen((v) => !v)}
                className="flex items-center gap-2 font-mono font-bold text-sm px-4 py-2 border-2 border-black bg-purple text-white shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
              >
                {/* Green dot = connected */}
                <span className={`w-2 h-2 rounded-full border border-white ${isCorrectNetwork ? 'bg-green-400' : 'bg-yellow-400'}`} />
                <span>{truncate(address)}</span>
                <span className="text-xs opacity-70">{panelOpen ? '▲' : '▼'}</span>
              </button>

              {panelOpen && (
                <WalletPanel
                  address={address}
                  isCorrectNetwork={isCorrectNetwork}
                  balance={balance}
                  onDisconnect={disconnect}
                  onSwitchNetwork={switchNetwork}
                  onClose={() => setPanelOpen(false)}
                />
              )}
            </div>
          ) : (
            /* Not connected: show connect button */
            <button
              onClick={connect}
              disabled={isConnecting}
              className="font-mono font-bold text-sm px-4 py-2 border-2 border-black bg-black text-cream shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none hover:bg-purple transition-all disabled:opacity-50"
            >
              {isConnecting ? 'CONNECTING...' : 'CONNECT WALLET'}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
