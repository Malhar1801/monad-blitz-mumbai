import { useEffect, useState } from "react";
import { ethers } from "ethers";
import axios from "axios";
import Navbar from "../components/navbar";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../utils/contract";
import { useToast, ToastContainer } from "../components/Toast";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500;600&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: #060514;
    font-family: 'DM Sans', sans-serif;
  }

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
    top: -30%;
    left: 50%;
    transform: translateX(-50%);
    width: 800px;
    height: 500px;
    background: radial-gradient(ellipse at center, rgba(109,40,217,0.12) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
  }

  .container {
    max-width: 960px;
    margin: 0 auto;
    padding: 3rem 2rem;
    position: relative;
    z-index: 1;
  }

  .page-header {
    margin-bottom: 2.5rem;
  }

  .page-title {
    font-family: 'DM Mono', monospace;
    font-size: 2rem;
    font-weight: 600;
    color: #c4b5fd;
    letter-spacing: -0.02em;
    line-height: 1.2;
    margin-bottom: 0.4rem;
  }

  .page-sub {
    font-size: 0.875rem;
    color: rgba(200,185,255,0.45);
    letter-spacing: 0.01em;
  }

  .tabs {
    display: flex;
    gap: 0;
    margin-bottom: 2.5rem;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(120,80,255,0.15);
    border-radius: 8px;
    padding: 4px;
    width: fit-content;
  }

  .tab-btn {
    padding: 0.5rem 1.5rem;
    border-radius: 5px;
    font-size: 0.78rem;
    font-weight: 600;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    cursor: pointer;
    border: none;
    transition: all 0.2s ease;
    font-family: 'DM Mono', monospace;
  }

  .tab-btn.active {
    background: linear-gradient(135deg, #7c3aed, #5b21b6);
    color: #f5f0ff;
    box-shadow: 0 2px 12px rgba(124,58,237,0.3);
  }

  .tab-btn.inactive {
    background: transparent;
    color: rgba(200,185,255,0.45);
  }

  .tab-btn.inactive:hover {
    color: rgba(200,185,255,0.8);
    background: rgba(255,255,255,0.04);
  }

  .tab-count {
    font-size: 0.7rem;
    opacity: 0.7;
    margin-left: 0.35rem;
  }

  .card-grid {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .prompt-card {
    background: rgba(255,255,255,0.025);
    border: 1px solid rgba(120,80,255,0.12);
    border-radius: 12px;
    padding: 1.5rem;
    transition: border-color 0.2s ease, background 0.2s ease;
    position: relative;
    overflow: hidden;
  }

  .prompt-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(167,139,250,0.3), transparent);
    opacity: 0;
    transition: opacity 0.3s;
  }

  .prompt-card:hover {
    border-color: rgba(120,80,255,0.28);
    background: rgba(255,255,255,0.035);
  }

  .prompt-card:hover::before {
    opacity: 1;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
  }

  .card-badges {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .badge-id {
    font-family: 'DM Mono', monospace;
    font-size: 0.7rem;
    font-weight: 600;
    color: rgba(167,139,250,0.8);
    background: rgba(109,40,217,0.15);
    border: 1px solid rgba(109,40,217,0.25);
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    letter-spacing: 0.04em;
  }

  .badge-cat {
    font-size: 0.68rem;
    font-weight: 500;
    color: rgba(200,185,255,0.55);
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .card-meta-right {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .rating-display {
    font-size: 0.78rem;
    color: rgba(250,204,21,0.85);
    font-family: 'DM Mono', monospace;
  }

  .price-display {
    font-family: 'DM Mono', monospace;
    font-size: 0.9rem;
    font-weight: 600;
    color: #a78bfa;
  }

  .card-title {
    font-size: 1.05rem;
    font-weight: 600;
    color: #f0e8ff;
    margin-bottom: 0.75rem;
    line-height: 1.4;
  }

  .creator-label {
    font-size: 0.68rem;
    color: rgba(200,185,255,0.35);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 0.2rem;
  }

  .creator-addr {
    font-family: 'DM Mono', monospace;
    font-size: 0.78rem;
    color: rgba(200,185,255,0.6);
    margin-bottom: 1rem;
  }

  .reveal-box {
    background: rgba(109,40,217,0.08);
    border: 1px solid rgba(109,40,217,0.2);
    border-radius: 8px;
    padding: 1rem 1.25rem;
    margin-bottom: 1rem;
  }

  .reveal-label {
    font-size: 0.65rem;
    color: rgba(167,139,250,0.7);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    margin-bottom: 0.5rem;
    font-family: 'DM Mono', monospace;
  }

  .reveal-text {
    color: rgba(240,232,255,0.85);
    font-size: 0.82rem;
    line-height: 1.7;
    white-space: pre-wrap;
  }

  .btn-reveal {
    width: 100%;
    background: transparent;
    border: 1px solid rgba(124,58,237,0.4);
    color: #c4b5fd;
    padding: 0.65rem;
    border-radius: 7px;
    font-size: 0.78rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    cursor: pointer;
    margin-bottom: 1rem;
    font-family: 'DM Mono', monospace;
    transition: all 0.2s;
  }

  .btn-reveal:hover {
    background: rgba(124,58,237,0.12);
    border-color: rgba(124,58,237,0.7);
  }

  .rating-row {
    display: flex;
    gap: 0.6rem;
    align-items: center;
    padding-top: 0.75rem;
    border-top: 1px solid rgba(255,255,255,0.05);
  }

  .rating-input {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(120,80,255,0.2);
    border-radius: 6px;
    padding: 0.45rem 0.75rem;
    color: #e9d5ff;
    font-size: 0.82rem;
    width: 90px;
    outline: none;
    font-family: 'DM Mono', monospace;
    transition: border-color 0.2s;
  }

  .rating-input:focus {
    border-color: rgba(124,58,237,0.6);
  }

  .btn-rate {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    color: rgba(200,185,255,0.75);
    padding: 0.45rem 1rem;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    cursor: pointer;
    font-family: 'DM Mono', monospace;
    transition: all 0.2s;
  }

  .btn-rate:hover {
    background: rgba(255,255,255,0.08);
    color: #c4b5fd;
  }

  .empty-state {
    text-align: center;
    padding: 5rem 2rem;
  }

  .empty-icon {
    width: 56px;
    height: 56px;
    background: rgba(109,40,217,0.1);
    border: 1px solid rgba(109,40,217,0.2);
    border-radius: 12px;
    margin: 0 auto 1.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .empty-title {
    font-size: 0.95rem;
    color: rgba(200,185,255,0.6);
    margin-bottom: 0.5rem;
    font-weight: 500;
  }

  .empty-link {
    font-size: 0.8rem;
    color: rgba(167,139,250,0.7);
    text-decoration: none;
    font-family: 'DM Mono', monospace;
    letter-spacing: 0.04em;
    transition: color 0.2s;
  }

  .empty-link:hover {
    color: #c4b5fd;
  }

  .spinner {
    width: 18px;
    height: 18px;
    border: 2px solid rgba(124,58,237,0.3);
    border-top-color: #7c3aed;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    flex-shrink: 0;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  .loading-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: rgba(200,185,255,0.4);
    font-size: 0.82rem;
    letter-spacing: 0.04em;
    padding: 3rem 0;
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
    width: 64px;
    height: 64px;
    background: rgba(109,40,217,0.12);
    border: 1px solid rgba(109,40,217,0.25);
    border-radius: 16px;
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

export default function MyPrompts() {
  const [account, setAccount] = useState(null);
  const [createdPrompts, setCreatedPrompts] = useState([]);
  const [boughtPrompts, setBoughtPrompts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [revealed, setRevealed] = useState({});
  const [rating, setRating] = useState({});
  const [activeTab, setActiveTab] = useState("created");
  const { toasts, toast } = useToast();

  const connectWallet = async () => {
    if (!window.ethereum) return toast.error("MetaMask not detected. Please install it.");
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const addr = await provider.getSigner().getAddress();
    setAccount(addr);
  };

  useEffect(() => {
    if (account) loadMyPrompts();
  }, [account]);

  const loadMyPrompts = async () => {
    setLoading(true);
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const myAddress = await signer.getAddress();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

      const ids = await contract.getAllPrompts();
      console.log("Total prompts:", ids.length);

      const created = [];
      const bought = [];

      await Promise.all(ids.map(async (id) => {
        try {
          const owner = await contract.ownerOf(id);
          const d = await contract.getPromptDetails(id);
          const rawPrompt = await contract.prompts(id);
          const ipfsHash = rawPrompt.ipfsHash;
          const creator = d.creator;

          const iAmOwner = owner.toLowerCase() === myAddress.toLowerCase();
          const iAmCreator = creator.toLowerCase() === myAddress.toLowerCase();

          if (!iAmOwner && !iAmCreator) return;

          let title = "Untitled Prompt";
          try {
            const res = await axios.get(
              `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
              { timeout: 8000 }
            );
            title = res.data.title || "Untitled Prompt";
          } catch (e) {}

          const promptData = {
            tokenId: id.toString(),
            price: ethers.utils.formatEther(d.price),
            category: d.category,
            avgRating: d.avgRating.toString(),
            ipfsHash,
            title,
            creator,
            owner,
          };

          if (iAmCreator) {
            created.push(promptData);
          } else if (iAmOwner && !iAmCreator) {
            bought.push(promptData);
          }
        } catch (e) {
          console.log("Error on token", id.toString(), e.message);
        }
      }));

      console.log("Created:", created.length, "Bought:", bought.length);
      setCreatedPrompts(created);
      setBoughtPrompts(bought);
    } catch (err) {
      console.error("Error:", err);
    }
    setLoading(false);
  };

  const reveal = async (tokenId, ipfsHash) => {
    try {
      const res = await axios.get(
        `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
        { timeout: 8000 }
      );
      setRevealed(prev => ({ ...prev, [tokenId]: res.data }));
    } catch (err) {
      toast.error("Failed to fetch prompt: " + err.message);
    }
  };

  const submitRating = async (tokenId) => {
    const r = Number(rating[tokenId]);
    if (!r || r < 1 || r > 5) return toast.error("Please enter a rating between 1 and 5.");
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.ratePrompt(tokenId, r);
      await tx.wait();
      toast.success("Rating submitted successfully.");
    } catch (err) {
      toast.error(err.reason || err.message);
    }
  };

  const PromptCard = ({ p, showReveal }) => (
    <div className="prompt-card">
      <div className="card-header">
        <div className="card-badges">
          <span className="badge-id">#{p.tokenId}</span>
          <span className="badge-cat">{p.category}</span>
        </div>
        <div className="card-meta-right">
          <span className="rating-display">{p.avgRating} / 5</span>
          <span className="price-display">{p.price} MON</span>
        </div>
      </div>

      <h3 className="card-title">{p.title}</h3>

      <div style={{ marginBottom: "1rem" }}>
        <p className="creator-label">Creator</p>
        <p className="creator-addr">{p.creator.slice(0, 6)}...{p.creator.slice(-4)}</p>
      </div>

      {showReveal && (
        revealed[p.tokenId] ? (
          <div className="reveal-box">
            <p className="reveal-label">Full Prompt</p>
            <p className="reveal-text">{revealed[p.tokenId].prompt}</p>
          </div>
        ) : (
          <button
            onClick={() => reveal(p.tokenId, p.ipfsHash)}
            className="btn-reveal"
          >
            Reveal Full Prompt
          </button>
        )
      )}

      <div className="rating-row">
        <input
          type="number" min="1" max="5" placeholder="1 – 5"
          value={rating[p.tokenId] || ""}
          onChange={e => setRating(prev => ({ ...prev, [p.tokenId]: e.target.value }))}
          className="rating-input"
        />
        <button onClick={() => submitRating(p.tokenId)} className="btn-rate">
          Submit Rating
        </button>
      </div>
    </div>
  );

  if (!account) {
    return (
      <>
        <style>{styles}</style>
        <div className="page-bg">
          <Navbar onConnect={setAccount} />
          <div className="connect-screen">
            <div className="connect-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(167,139,250,0.8)" strokeWidth="1.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <h1 style={{ fontFamily: "'DM Mono', monospace", fontSize: "1.6rem", fontWeight: 600, color: "#c4b5fd", letterSpacing: "-0.01em" }}>
              My Prompts
            </h1>
            <p style={{ color: "rgba(200,185,255,0.4)", fontSize: "0.875rem" }}>
              Connect your wallet to view your prompts
            </p>
            <button onClick={connectWallet} className="btn-connect">
              Connect Wallet
            </button>
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
          <div className="page-header">
            <h1 className="page-title">My Prompts</h1>
            <p className="page-sub">Manage your created and purchased prompt NFTs</p>
          </div>

          <div className="tabs">
            <button
              onClick={() => setActiveTab("created")}
              className={`tab-btn ${activeTab === "created" ? "active" : "inactive"}`}
            >
              Created <span className="tab-count">({createdPrompts.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("bought")}
              className={`tab-btn ${activeTab === "bought" ? "active" : "inactive"}`}
            >
              Purchased <span className="tab-count">({boughtPrompts.length})</span>
            </button>
          </div>

          {loading ? (
            <div className="loading-row">
              <div className="spinner" />
              Loading your prompts...
            </div>
          ) : activeTab === "created" ? (
            createdPrompts.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(167,139,250,0.6)" strokeWidth="1.5">
                    <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                  </svg>
                </div>
                <p className="empty-title">No prompts created yet</p>
                <a href="/create" className="empty-link">Create your first prompt &rarr;</a>
              </div>
            ) : (
              <div className="card-grid">
                {createdPrompts.map(p => (
                  <PromptCard key={p.tokenId} p={p} showReveal={false} />
                ))}
              </div>
            )
          ) : (
            boughtPrompts.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(167,139,250,0.6)" strokeWidth="1.5">
                    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                  </svg>
                </div>
                <p className="empty-title">No purchased prompts yet</p>
                <a href="/" className="empty-link">Browse marketplace &rarr;</a>
              </div>
            ) : (
              <div className="card-grid">
                {boughtPrompts.map(p => (
                  <PromptCard key={p.tokenId} p={p} showReveal={true} />
                ))}
              </div>
            )
          )}
        </div>
      </div>
      <ToastContainer toasts={toasts} />
    </>
  );
}