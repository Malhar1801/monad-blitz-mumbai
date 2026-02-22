import { useState, useEffect } from "react";
import Link from "next/link";
import { ethers } from "ethers";

export default function Navbar({ onConnect }) {
  const [account, setAccount] = useState(null);

  useEffect(() => {
    // Check if already connected
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      provider.listAccounts().then(accounts => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          if (onConnect) onConnect(accounts[0]);
        }
      });
    }
  }, []);

  const connect = async () => {
    if (!window.ethereum) return alert("Install MetaMask!");
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const addr = await provider.getSigner().getAddress();
    setAccount(addr);
    if (onConnect) onConnect(addr);
  };

  return (
    <nav className="flex justify-between items-center px-8 py-4 bg-purple-950 border-b border-purple-800 text-white">
      <Link href="/" className="text-2xl font-bold text-purple-300">⚡ PromptFi</Link>
      <div className="flex gap-6 text-sm">
        <Link href="/" className="hover:text-purple-300">Marketplace</Link>
        <Link href="/create" className="hover:text-purple-300">Create</Link>
        <Link href="/my-prompts" className="hover:text-purple-300">My Prompts</Link>
      </div>
      <button onClick={connect} className="bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-lg text-sm font-medium">
        {account ? `${account.slice(0,6)}...${account.slice(-4)}` : "Connect Wallet"}
      </button>
    </nav>
  );
}