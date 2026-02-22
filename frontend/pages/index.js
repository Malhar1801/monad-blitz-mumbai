import { useEffect, useState } from "react";
import { ethers } from "ethers";
import axios from "axios";
import Navbar from "../components/navbar";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../utils/contract";
import { useToast, ToastContainer } from "../components/Toast";

const CATEGORIES = ["All", "ChatGPT", "Coding", "Design", "Marketing", "Other"];

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
    width: 1000px;
    height: 600px;
    background: radial-gradient(ellipse at center, rgba(109,40,217,0.1) 0%, transparent 68%);
    pointer-events: none;
    z-index: 0;
  }

  .container {
    max-width: 1100px;
    margin: 0 auto;
    padding: 3rem 2rem;
    position: relative;
    z-index: 1;
  }

  .page-header { margin-bottom: 2rem; }

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
    color: rgba(200,185,255,0.4);
  }

  .filter-row {
    display: flex;
    gap: 0.4rem;
    margin-bottom: 2.5rem;
    flex-wrap: wrap;
  }

  .filter-btn {
    padding: 0.4rem 1rem;
    border-radius: 999px;
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    cursor: pointer;
    border: none;
    font-family: 'DM Mono', monospace;
    transition: all 0.18s;
  }

  .filter-btn.active {
    background: linear-gradient(135deg, #7c3aed, #5b21b6);
    color: #f5f0ff;
    box-shadow: 0 2px 12px rgba(124,58,237,0.3);
  }

  .filter-btn.inactive {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.07);
    color: rgba(200,185,255,0.45);
  }

  .filter-btn.inactive:hover {
    background: rgba(255,255,255,0.07);
    color: rgba(200,185,255,0.8);
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1rem;
  }

  .card {
    background: rgba(255,255,255,0.025);
    border: 1px solid rgba(120,80,255,0.12);
    border-radius: 12px;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    transition: border-color 0.2s, background 0.2s, transform 0.2s;
    position: relative;
    overflow: hidden;
  }

  .card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(167,139,250,0.3), transparent);
    opacity: 0;
    transition: opacity 0.3s;
  }

  .card:hover {
    border-color: rgba(120,80,255,0.28);
    background: rgba(255,255,255,0.035);
    transform: translateY(-2px);
  }

  .card:hover::before { opacity: 1; }

  .card-top {
    display: flex;
    justify-content: space-between;
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
  }

  .badge-cat {
    font-size: 0.68rem;
    font-weight: 500;
    color: rgba(200,185,255,0.5);
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .card-title {
    font-size: 1rem;
    font-weight: 600;
    color: #f0e8ff;
    line-height: 1.4;
  }

  .card-desc {
    font-size: 0.8rem;
    color: rgba(200,185,255,0.45);
    line-height: 1.65;
  }

  .creator-label {
    font-size: 0.65rem;
    color: rgba(200,185,255,0.3);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 0.15rem;
  }

  .creator-addr {
    font-family: 'DM Mono', monospace;
    font-size: 0.75rem;
    color: rgba(200,185,255,0.55);
  }

  .card-bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: auto;
    padding-top: 0.25rem;
  }

  .price {
    font-family: 'DM Mono', monospace;
    font-size: 1.2rem;
    font-weight: 600;
    color: #a78bfa;
  }

  .rating {
    font-size: 0.75rem;
    color: rgba(250,204,21,0.8);
    font-family: 'DM Mono', monospace;
  }

  .btn-buy {
    width: 100%;
    background: linear-gradient(135deg, #7c3aed, #5b21b6);
    border: none;
    color: #f5f0ff;
    padding: 0.7rem;
    border-radius: 8px;
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    cursor: pointer;
    font-family: 'DM Mono', monospace;
    box-shadow: 0 2px 14px rgba(124,58,237,0.25);
    transition: all 0.2s;
  }

  .btn-buy:hover:not(:disabled) {
    box-shadow: 0 4px 22px rgba(124,58,237,0.45);
    transform: translateY(-1px);
  }

  .btn-buy:disabled {
    background: rgba(255,255,255,0.06);
    color: rgba(200,185,255,0.3);
    cursor: not-allowed;
    box-shadow: none;
  }

  .spinner {
    width: 18px; height: 18px;
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
    padding: 4rem 0;
    letter-spacing: 0.04em;
  }

  .empty-text {
    color: rgba(200,185,255,0.35);
    font-size: 0.9rem;
    padding: 4rem 0;
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

  .connect-title {
    font-family: 'DM Mono', monospace;
    font-size: 1.8rem;
    font-weight: 600;
    color: #c4b5fd;
    letter-spacing: -0.02em;
  }

  .connect-sub {
    color: rgba(200,185,255,0.45);
    font-size: 0.875rem;
    max-width: 320px;
    line-height: 1.6;
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

export default function Marketplace() {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("All");
  const [buying, setBuying] = useState(null);
  const [account, setAccount] = useState(null);
  const { toasts, toast } = useToast();

  const connectWallet = async () => {
    if (!window.ethereum) return toast.error("MetaMask not detected. Please install it.");
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const addr = await provider.getSigner().getAddress();
    setAccount(addr);
  };

  useEffect(() => {
    if (account) loadPrompts();
  }, [account]);

  const loadPrompts = async () => {
    setLoading(true);
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

      console.log("Fetching from contract:", CONTRACT_ADDRESS);
      const ids = await contract.getAllPrompts();
      console.log("IDs found:", ids.length);

      if (ids.length === 0) {
        setLoading(false);
        return;
      }

      const list = await Promise.all(ids.map(async (id) => {
        try {
          const d = await contract.getPromptDetails(id);
          const rawPrompt = await contract.prompts(id);
          const ipfsHash = rawPrompt.ipfsHash;

          let title = "Untitled Prompt";
          let description = "";
          try {
            const res = await axios.get(
              `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
              { timeout: 8000 }
            );
            title = res.data.title || "Untitled Prompt";
            description = res.data.prompt
              ? res.data.prompt.slice(0, 80) + "..."
              : "";
          } catch (e) {
            console.log("IPFS failed:", e.message);
          }

          return {
            tokenId: id.toString(),
            price: ethers.utils.formatEther(d.price),
            creator: d.creator,
            active: d.active,
            category: d.category,
            avgRating: d.avgRating.toString(),
            ipfsHash,
            title,
            
          };
        } catch (e) {
          console.log("Error on token", id.toString(), e.message);
          return null;
        }
      }));

      const active = list.filter(p => p && p.active);
      setPrompts(active);
    } catch (err) {
      console.error("loadPrompts error:", err);
    }
    setLoading(false);
  };

  const buy = async (tokenId, price) => {
    try {
      setBuying(tokenId);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.buyPrompt(tokenId, {
        value: ethers.utils.parseEther(price),
      });
      await tx.wait();
      toast.success("Purchase successful. Visit My Prompts to reveal.");
      loadPrompts();
    } catch (err) {
      toast.error(err.reason || err.message);
    }
    setBuying(null);
  };

  const filtered = filter === "All" ? prompts : prompts.filter(p => p.category === filter);

  if (!account) {
    return (
      <>
        <style>{styles}</style>
        <div className="page-bg">
          <Navbar onConnect={setAccount} />
          <div className="connect-screen">
            <div className="connect-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(167,139,250,0.8)" strokeWidth="1.5">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            </div>
            <h1 className="connect-title">PromptFi</h1>
            <p className="connect-sub">The decentralized AI prompt marketplace on Monad. Own your prompts as NFTs.</p>
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
          <div className="page-header">
            <h1 className="page-title">Prompt Marketplace</h1>
            <p className="page-sub">Buy AI prompts as NFTs on Monad. Own them permanently on-chain.</p>
          </div>

          <div className="filter-row">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setFilter(cat)}
                className={`filter-btn ${filter === cat ? "active" : "inactive"}`}>
                {cat}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="loading-row">
              <div className="spinner" />
              Loading prompts from chain...
            </div>
          ) : filtered.length === 0 ? (
            <p className="empty-text">No prompts found. Be the first to create one.</p>
          ) : (
            <div className="grid">
              {filtered.map(p => (
                <div key={p.tokenId} className="card">
                  <div className="card-top">
                    <span className="badge-id">#{p.tokenId}</span>
                    <span className="badge-cat">{p.category}</span>
                  </div>
                  <h3 className="card-title">{p.title}</h3>
                  {p.description && <p className="card-desc">{p.description}</p>}
                  <div>
                    <p className="creator-label">Creator</p>
                    <p className="creator-addr">{p.creator.slice(0, 6)}...{p.creator.slice(-4)}</p>
                  </div>
                  <div className="card-bottom">
                    <p className="price">{p.price} MON</p>
                    <p className="rating">{p.avgRating} / 5</p>
                  </div>
                  <button
                    onClick={() => buy(p.tokenId, p.price)}
                    disabled={buying === p.tokenId}
                    className="btn-buy"
                  >
                    {buying === p.tokenId ? "Processing..." : "Buy & Unlock"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <ToastContainer toasts={toasts} />
    </>
  );
}