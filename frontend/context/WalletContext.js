'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

const WalletContext = createContext(null);

const MONAD_CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '10143');
const MONAD_RPC      = process.env.NEXT_PUBLIC_MONAD_RPC || 'https://testnet-rpc.monad.xyz';

const MONAD_CHAIN_PARAMS = {
  chainId:            `0x${MONAD_CHAIN_ID.toString(16)}`,
  chainName:          'Monad Testnet',
  nativeCurrency:     { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls:            [MONAD_RPC],
  blockExplorerUrls:  ['https://testnet.monadexplorer.com'],
};

export function WalletProvider({ children }) {
  const [address,          setAddress]          = useState(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [isConnecting,     setIsConnecting]     = useState(false);
  const [provider,         setProvider]         = useState(null);

  // ── helpers ────────────────────────────────────────────────────────────────

  const checkNetwork = useCallback(async () => {
    if (!window.ethereum) return false;
    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const correct = parseInt(chainId, 16) === MONAD_CHAIN_ID;
      setIsCorrectNetwork(correct);
      return correct;
    } catch {
      return false;
    }
  }, []);

  const switchNetwork = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: MONAD_CHAIN_PARAMS.chainId }],
      });
    } catch (err) {
      if (err.code === 4902) {
        // Chain not in MetaMask yet — add it
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [MONAD_CHAIN_PARAMS],
        });
      }
    }
  }, []);

  // ── connect — forces MetaMask account-picker every time ────────────────────
  const connect = useCallback(async () => {
    if (!window.ethereum) {
      alert('MetaMask not found. Please install MetaMask from https://metamask.io');
      return;
    }
    setIsConnecting(true);
    try {
      // wallet_requestPermissions always opens the MetaMask popup
      // letting the user pick any account — even ones already "connected"
      await window.ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }],
      });

      // After permission granted, read the selected accounts
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        const web3Provider = new ethers.BrowserProvider(window.ethereum);
        setAddress(accounts[0]);
        setProvider(web3Provider);

        const correct = await checkNetwork();
        if (!correct) await switchNetwork();
      }
    } catch (err) {
      // User rejected MetaMask popup — not an error we need to surface
      if (err.code !== 4001) {
        console.error('[Wallet] Connection error:', err);
      }
    } finally {
      setIsConnecting(false);
    }
  }, [checkNetwork, switchNetwork]);

  // ── disconnect ─────────────────────────────────────────────────────────────
  const disconnect = useCallback(() => {
    setAddress(null);
    setProvider(null);
    setIsCorrectNetwork(false);
  }, []);

  // ── getSigner for tx signing ───────────────────────────────────────────────
  const getSigner = useCallback(async () => {
    if (!provider) throw new Error('Wallet not connected');
    return await provider.getSigner();
  }, [provider]);

  // ── auto-reconnect: silently restore last connected account on page load ───
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return;

    // eth_accounts (no prompt) — returns accounts if already permitted
    window.ethereum.request({ method: 'eth_accounts' }).then((accounts) => {
      if (accounts.length > 0) {
        setAddress(accounts[0]);
        setProvider(new ethers.BrowserProvider(window.ethereum));
        checkNetwork();
      }
    }).catch(() => {});

    // Account switch in MetaMask (user changes account in extension)
    const onAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        setAddress(null);
        setProvider(null);
        setIsCorrectNetwork(false);
      } else {
        setAddress(accounts[0]);
        setProvider(new ethers.BrowserProvider(window.ethereum));
        checkNetwork();
      }
    };

    // Chain/network changed in MetaMask
    const onChainChanged = () => {
      checkNetwork();
    };

    window.ethereum.on('accountsChanged', onAccountsChanged);
    window.ethereum.on('chainChanged',    onChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', onAccountsChanged);
      window.ethereum.removeListener('chainChanged',    onChainChanged);
    };
  }, [checkNetwork]);

  return (
    <WalletContext.Provider value={{
      address,
      isCorrectNetwork,
      isConnecting,
      provider,
      connect,
      disconnect,
      getSigner,
      switchNetwork,
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used inside WalletProvider');
  return ctx;
}
