import { useState, useEffect } from "react";
import Link from "next/link";
import { ethers } from "ethers";

export default function Navbar({ onConnect }) {
  const [account, setAccount] = useState(null);

  useEffect(() => {
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      provider.listAccounts().then(accounts => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          if (onConnect) onConnect(accounts[0]);
        }
      });
    }
  }, [onConnect]);

  const connect = async () => {
    if (!window.ethereum) {
      // You can replace with ToastModal later if you want
      console.warn("MetaMask not detected");
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const addr = await provider.getSigner().getAddress();
      setAccount(addr);
      if (onConnect) onConnect(addr);
    } catch (err) {
      console.error("Wallet connection failed:", err);
    }
  };

  return (
    <nav className="
      sticky top-0 z-50
      flex items-center justify-between
      px-6 sm:px-8 md:px-10 lg:px-12
      py-4 md:py-5
      bg-gradient-to-r from-purple-950/80 via-black/80 to-purple-950/80
      backdrop-blur-md
      border-b border-purple-900/60
      text-white
    ">
      <Link
        href="/"
        className="
          text-2xl md:text-3xl
          font-extrabold
          bg-clip-text text-transparent
          bg-gradient-to-r from-purple-300 via-purple-200 to-cyan-300
          tracking-tight
          hover:opacity-90 transition-opacity
        "
      >
        PromptFi
      </Link>

      <div className="hidden md:flex items-center gap-8 lg:gap-10 text-sm font-medium">
        <Link
          href="/"
          className="
            text-gray-200 hover:text-purple-300
            transition-colors duration-200
            relative after:content-[''] after:absolute after:bottom-[-4px]
            after:left-0 after:w-0 after:h-[2px] after:bg-purple-400
            hover:after:w-full after:transition-all after:duration-300
          "
        >
          Marketplace
        </Link>
        <Link
          href="/create"
          className="
            text-gray-200 hover:text-purple-300
            transition-colors duration-200
            relative after:content-[''] after:absolute after:bottom-[-4px]
            after:left-0 after:w-0 after:h-[2px] after:bg-purple-400
            hover:after:w-full after:transition-all after:duration-300
          "
        >
          Create
        </Link>
        <Link
          href="/my-prompts"
          className="
            text-gray-200 hover:text-purple-300
            transition-colors duration-200
            relative after:content-[''] after:absolute after:bottom-[-4px]
            after:left-0 after:w-0 after:h-[2px] after:bg-purple-400
            hover:after:w-full after:transition-all after:duration-300
          "
        >
          My Prompts
        </Link>
      </div>

      <button
        onClick={connect}
        className="
          relative overflow-hidden
          px-5 py-2.5 md:px-6 md:py-3
          bg-gradient-to-r from-purple-600 to-purple-700
          hover:from-purple-500 hover:to-purple-600
          rounded-xl
          font-medium text-sm md:text-base
          transition-all duration-300
          shadow-md shadow-purple-900/30
          hover:shadow-lg hover:shadow-purple-900/50
          hover:scale-[1.03] active:scale-[0.98]
          border border-purple-500/30
        "
      >
        {account
          ? `${account.slice(0, 6)}…${account.slice(-4)}`
          : "Connect Wallet"}
      </button>

      {/* Optional: mobile menu placeholder — add later if needed */}
      {/* <div className="md:hidden">… hamburger menu …</div> */}
    </nav>
  );
}