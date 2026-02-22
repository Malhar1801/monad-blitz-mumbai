import { useState, useEffect } from "react";
import Link from "next/link";
import { ethers } from "ethers";

export default function Navbar({ onConnect }) {
  const [account, setAccount] = useState(null);
  const [scrolled, setScrolled] = useState(false);

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
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
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
    <nav style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "0 2.5rem",
      height: "64px",
      background: scrolled ? "rgba(6,5,20,0.97)" : "rgba(6,5,20,0.85)",
      backdropFilter: "blur(16px)",
      borderBottom: "1px solid rgba(120,80,255,0.15)",
      position: "sticky",
      top: 0,
      zIndex: 100,
      transition: "background 0.3s ease",
    }}>
      <Link href="/" style={{
        fontSize: "1.2rem",
        fontWeight: 700,
        letterSpacing: "0.08em",
        color: "#c4b5fd",
        textDecoration: "none",
        fontFamily: "'DM Mono', monospace",
        textTransform: "uppercase",
      }}>
        PromptFi
      </Link>

      <div style={{ display: "flex", gap: "2.5rem", alignItems: "center" }}>
        {[
          { href: "/", label: "Marketplace" },
          { href: "/create", label: "Create" },
          { href: "/my-prompts", label: "My Prompts" },
        ].map(({ href, label }) => (
          <Link key={href} href={href} style={{
            fontSize: "0.8rem",
            fontWeight: 500,
            letterSpacing: "0.1em",
            color: "rgba(200,185,255,0.7)",
            textDecoration: "none",
            textTransform: "uppercase",
            transition: "color 0.2s",
          }}
          onMouseEnter={e => e.target.style.color = "#c4b5fd"}
          onMouseLeave={e => e.target.style.color = "rgba(200,185,255,0.7)"}
          >{label}</Link>
        ))}
      </div>

      <button onClick={connect} style={{
        background: account ? "transparent" : "linear-gradient(135deg, #7c3aed, #5b21b6)",
        border: account ? "1px solid rgba(124,58,237,0.5)" : "none",
        color: "#e9d5ff",
        padding: "0.45rem 1.1rem",
        borderRadius: "6px",
        fontSize: "0.75rem",
        fontWeight: 600,
        letterSpacing: "0.08em",
        cursor: "pointer",
        fontFamily: "'DM Mono', monospace",
        transition: "all 0.2s",
      }}>
        {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : "Connect Wallet"}
      </button>
    </nav>
  );
}