import { useState } from "react";
import axios from "axios";
import { ethers } from "ethers";
import Navbar from "../components/navbar";
import { getContract } from "../utils/contract";
import { useToast, ToastContainer } from "../components/Toast";

const CATEGORIES = ["ChatGPT", "Coding", "Design", "Marketing", "Other"];

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500;600&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body { background: #060514; font-family: 'DM Sans', sans-serif; }

  .page-bg {
    min-height: 100vh;
    background: #060514;
    color: #e9d5ff;
    position: relative;
    overflow-x: hidden;
  }

  .page-bg::before {
    content: '';
    position: fixed;
    top: -20%;
    left: 50%;
    transform: translateX(-50%);
    width: 800px;
    height: 600px;
    background: radial-gradient(ellipse at center, rgba(109,40,217,0.1) 0%, transparent 68%);
    pointer-events: none;
    z-index: 0;
  }

  .container {
    max-width: 640px;
    margin: 0 auto;
    padding: 3rem 2rem;
    position: relative;
    z-index: 1;
  }

  .page-title {
    font-family: 'DM Mono', monospace;
    font-size: 2rem;
    font-weight: 600;
    color: #c4b5fd;
    letter-spacing: -0.02em;
    margin-bottom: 0.4rem;
  }

  .page-sub {
    font-size: 0.875rem;
    color: rgba(200,185,255,0.4);
    margin-bottom: 2.5rem;
  }

  .form-card {
    background: rgba(255,255,255,0.022);
    border: 1px solid rgba(120,80,255,0.14);
    border-radius: 14px;
    padding: 2rem;
    display: flex;
    flex-direction: column;
    gap: 1.4rem;
  }

  .field { display: flex; flex-direction: column; gap: 0.45rem; }

  .label {
    font-size: 0.7rem;
    font-weight: 600;
    color: rgba(200,185,255,0.45);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    font-family: 'DM Mono', monospace;
  }

  .input, .select, .textarea {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(120,80,255,0.18);
    border-radius: 8px;
    padding: 0.75rem 1rem;
    color: #e9d5ff;
    font-size: 0.875rem;
    font-family: 'DM Sans', sans-serif;
    outline: none;
    transition: border-color 0.2s;
    width: 100%;
  }

  .input::placeholder, .textarea::placeholder {
    color: rgba(200,185,255,0.25);
  }

  .input:focus, .select:focus, .textarea:focus {
    border-color: rgba(124,58,237,0.55);
    background: rgba(255,255,255,0.055);
  }

  .select {
    appearance: none;
    cursor: pointer;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(167,139,250,0.6)' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 1rem center;
    padding-right: 2.5rem;
  }

  .select option { background: #0e0b22; color: #e9d5ff; }

  .textarea { resize: none; line-height: 1.65; }

  .step-box {
    background: rgba(109,40,217,0.08);
    border: 1px solid rgba(109,40,217,0.22);
    border-radius: 8px;
    padding: 0.85rem 1rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .spinner {
    width: 16px; height: 16px;
    border: 2px solid rgba(124,58,237,0.3);
    border-top-color: #7c3aed;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    flex-shrink: 0;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  .step-text {
    font-size: 0.8rem;
    color: rgba(167,139,250,0.85);
    font-family: 'DM Mono', monospace;
  }

  .wallet-box {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 8px;
    padding: 0.85rem 1rem;
  }

  .wallet-label {
    font-size: 0.65rem;
    color: rgba(200,185,255,0.35);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 0.2rem;
    font-family: 'DM Mono', monospace;
  }

  .wallet-addr {
    font-family: 'DM Mono', monospace;
    font-size: 0.8rem;
    color: rgba(167,139,250,0.75);
  }

  .divider {
    height: 1px;
    background: rgba(255,255,255,0.05);
    margin: 0;
  }

  .btn-mint {
    width: 100%;
    background: linear-gradient(135deg, #7c3aed, #5b21b6);
    border: none;
    color: #f5f0ff;
    padding: 0.85rem;
    border-radius: 8px;
    font-size: 0.82rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    cursor: pointer;
    font-family: 'DM Mono', monospace;
    box-shadow: 0 4px 20px rgba(124,58,237,0.3);
    transition: all 0.2s;
  }

  .btn-mint:hover:not(:disabled) {
    box-shadow: 0 4px 28px rgba(124,58,237,0.5);
    transform: translateY(-1px);
  }

  .btn-mint:disabled {
    background: rgba(255,255,255,0.06);
    color: rgba(200,185,255,0.3);
    cursor: not-allowed;
    box-shadow: none;
    transform: none;
  }

  .connect-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 78vh;
    gap: 1.25rem;
    text-align: center;
  }

  .connect-icon {
    width: 72px; height: 72px;
    background: rgba(109,40,217,0.1);
    border: 1px solid rgba(109,40,217,0.22);
    border-radius: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 0.5rem;
  }

  .btn-connect {
    background: linear-gradient(135deg, #7c3aed, #5b21b6);
    border: none;
    color: #f5f0ff;
    padding: 0.85rem 2.25rem;
    border-radius: 8px;
    font-size: 0.82rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    cursor: pointer;
    font-family: 'DM Mono', monospace;
    box-shadow: 0 4px 20px rgba(124,58,237,0.35);
    transition: all 0.2s;
    margin-top: 0.5rem;
  }

  .btn-connect:hover {
    box-shadow: 0 4px 28px rgba(124,58,237,0.5);
    transform: translateY(-1px);
  }
`;

export default function Create() {
  const [account, setAccount] = useState(null);
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("ChatGPT");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("");
  const { toasts, toast } = useToast();

  const connectWallet = async () => {
    if (!window.ethereum) return toast.error("MetaMask not detected. Please install it.");
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const addr = await provider.getSigner().getAddress();
    setAccount(addr);
  };

  const uploadToIPFS = async () => {
    const res = await axios.post(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      { pinataContent: { title, prompt, category, createdAt: new Date().toISOString() } },
      {
        headers: {
          pinata_api_key: process.env.NEXT_PUBLIC_PINATA_API_KEY,
          pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_SECRET,
        },
      }
    );
    return res.data.IpfsHash;
  };

  const handleCreate = async () => {
    if (!title || !prompt || !price) return toast.error("Please fill in all fields before minting.");
    try {
      setLoading(true);
      setStep("Uploading to IPFS...");
      const ipfsHash = await uploadToIPFS();
      setStep("Minting NFT on Monad...");
      const contract = await getContract(true);
      const tx = await contract.createPrompt(ipfsHash, ethers.utils.parseEther(price), category);
      await tx.wait();
      setStep("");
      toast.success("Prompt minted successfully as an NFT.");
      setTitle("");
      setPrompt("");
      setPrice("");
    } catch (err) {
      toast.error(err.reason || err.message);
    }
    setLoading(false);
    setStep("");
  };

  if (!account) {
    return (
      <>
        <style>{styles}</style>
        <div className="page-bg">
          <Navbar onConnect={setAccount} />
          <div className="connect-screen">
            <div className="connect-icon">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="rgba(167,139,250,0.8)" strokeWidth="1.5">
                <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
            </div>
            <h1 style={{ fontFamily: "'DM Mono', monospace", fontSize: "1.6rem", fontWeight: 600, color: "#c4b5fd" }}>
              Create a Prompt NFT
            </h1>
            <p style={{ color: "rgba(200,185,255,0.4)", fontSize: "0.875rem", maxWidth: "280px", lineHeight: 1.6 }}>
              Connect your wallet to mint and sell your AI prompts on-chain
            </p>
            <button onClick={connectWallet} className="btn-connect">Connect Wallet</button>
          </div>
        </div>
        <ToastContainer toasts={toasts} />
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="page-bg">
        <Navbar onConnect={setAccount} />
        <div className="container">
          <h1 className="page-title">Create Prompt NFT</h1>
          <p className="page-sub">Mint your AI prompt and list it for sale on-chain</p>

          <div className="form-card">
            <div className="field">
              <label className="label">Title</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Perfect SEO Blog Writer"
                className="input"
              />
            </div>

            <div className="field">
              <label className="label">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="select">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div className="field">
              <label className="label">Your Prompt</label>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                rows={7}
                placeholder="Write your full AI prompt here..."
                className="textarea"
              />
            </div>

            <div className="field">
              <label className="label">Price (MON)</label>
              <input
                type="number"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="e.g. 0.01"
                className="input"
              />
            </div>

            {step && (
              <div className="step-box">
                <div className="spinner" />
                <span className="step-text">{step}</span>
              </div>
            )}

            <div className="divider" />

            <div className="wallet-box">
              <p className="wallet-label">Connected as</p>
              <p className="wallet-addr">{account.slice(0, 6)}...{account.slice(-4)}</p>
            </div>

            <button onClick={handleCreate} disabled={loading} className="btn-mint">
              {loading ? "Processing..." : "Mint as NFT"}
            </button>
          </div>
        </div>
      </div>
      <ToastContainer toasts={toasts} />
    </>
  );
}