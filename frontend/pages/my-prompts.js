import { useEffect, useState } from "react";
import { ethers } from "ethers";
import axios from "axios";
import Navbar from "../components/navbar";
import ToastModal from "../components/ToastModal"; // ← new
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../utils/contract";

export default function MyPrompts() {
  const [account, setAccount] = useState(null);
  const [createdPrompts, setCreatedPrompts] = useState([]);
  const [boughtPrompts, setBoughtPrompts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [revealed, setRevealed] = useState({});
  const [rating, setRating] = useState({});
  const [activeTab, setActiveTab] = useState("created");

  // Toast state
  const [toast, setToast] = useState({ message: "", type: "info" });

  const showToast = (msg, type = "info") => {
    setToast({ message: msg, type });
  };

  const connectWallet = async () => {
    if (!window.ethereum) return showToast("MetaMask not detected. Please install it.", "error");
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
          } catch {}

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

          if (iAmCreator) created.push(promptData);
          else if (iAmOwner) bought.push(promptData);
        } catch (e) {
          console.log("Error on token", id.toString(), e.message);
        }
      }));

      setCreatedPrompts(created);
      setBoughtPrompts(bought);
    } catch (err) {
      console.error("Error:", err);
      showToast("Failed to load prompts. Please try again.", "error");
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
      showToast("Could not load full prompt. IPFS may be slow.", "error");
    }
  };

  const submitRating = async (tokenId) => {
    const r = Number(rating[tokenId]);
    if (!r || r < 1 || r > 5) return showToast("Please enter rating between 1–5", "error");

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.ratePrompt(tokenId, r);
      await tx.wait();
      showToast("Rating submitted successfully", "success");
      // Optional: reload prompts to update avgRating
    } catch (err) {
      showToast(err.reason || "Transaction failed", "error");
    }
  };

  const PromptCard = ({ p, showReveal }) => (
    <div className="group relative bg-gradient-to-br from-gray-900 via-gray-950 to-black border border-purple-900/60 rounded-2xl p-6 shadow-lg shadow-purple-950/20 hover:shadow-purple-900/40 transition-all duration-300 hover:-translate-y-1">
      <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/10 to-cyan-900/10 opacity-0 group-hover:opacity-60 rounded-2xl transition-opacity pointer-events-none"></div>

      <div className="relative flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <span className="bg-purple-950/70 backdrop-blur-sm text-purple-300 text-xs px-3 py-1 rounded-full border border-purple-800/40">#{p.tokenId}</span>
          <span className="bg-gray-800/70 backdrop-blur-sm text-gray-300 text-xs px-3 py-1 rounded-full border border-gray-700/50">{p.category}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-yellow-400/90 text-sm font-medium">★ {p.avgRating}/5</span>
          <span className="text-cyan-400 font-bold text-lg">{p.price} MON</span>
        </div>
      </div>

      <h3 className="text-white font-semibold text-xl mb-3 line-clamp-2">{p.title}</h3>

      <div className="mb-4">
        <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Creator</p>
        <p className="text-sm font-mono text-gray-300 tracking-tight">
          {p.creator.slice(0,6)}…{p.creator.slice(-4)}
        </p>
      </div>

      {showReveal && (
        revealed[p.tokenId] ? (
          <div className="bg-black/40 backdrop-blur-md rounded-xl p-5 mb-5 border border-purple-800/30">
            <p className="text-purple-300 text-xs uppercase tracking-wider mb-2">Full Prompt</p>
            <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap font-light">
              {revealed[p.tokenId].prompt}
            </p>
          </div>
        ) : (
          <button
            onClick={() => reveal(p.tokenId, p.ipfsHash)}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 py-3 rounded-xl font-semibold text-sm tracking-wide transition-all shadow-md hover:shadow-lg hover:shadow-purple-900/40"
          >
            Reveal Full Prompt
          </button>
        )
      )}

      <div className="flex gap-3 mt-4">
        <input
          type="number" min="1" max="5" placeholder="1–5"
          value={rating[p.tokenId] || ""}
          onChange={e => setRating(prev => ({ ...prev, [p.tokenId]: e.target.value }))}
          className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm w-24 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition"
        />
        <button
          onClick={() => submitRating(p.tokenId)}
          className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-500 px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
        >
          Submit Rating
        </button>
      </div>
    </div>
  );

  if (!account) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-black to-gray-950 text-white">
        <Navbar onConnect={setAccount} />
        <div className="flex flex-col items-center justify-center min-h-[80vh] gap-8 px-6">
          <h1 className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400">My Prompts</h1>
          <p className="text-gray-400 text-xl max-w-md text-center">Connect your wallet to view your created and purchased prompts</p>
          <button
            onClick={connectWallet}
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 px-10 py-5 rounded-2xl font-bold text-lg shadow-xl shadow-purple-900/30 transition-all hover:scale-105"
          >
            Connect Wallet
          </button>
        </div>
        <ToastModal {...toast} onClose={() => setToast({ message: "" })} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-black to-gray-950 text-white">
      <Navbar onConnect={setAccount} />
      <div className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400 mb-2">My Prompts</h1>
        <p className="text-gray-400 mb-10 text-lg">Manage your created & purchased AI prompts</p>

        <div className="flex gap-3 mb-10 flex-wrap">
          <button
            onClick={() => setActiveTab("created")}
            className={`px-7 py-3 rounded-2xl font-medium tracking-wide transition-all ${
              activeTab === "created"
                ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-900/40"
                : "bg-gray-900/70 backdrop-blur-sm border border-gray-800 hover:border-purple-700 text-gray-300"
            }`}
          >
            Created by Me ({createdPrompts.length})
          </button>
          <button
            onClick={() => setActiveTab("bought")}
            className={`px-7 py-3 rounded-2xl font-medium tracking-wide transition-all ${
              activeTab === "bought"
                ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-900/40"
                : "bg-gray-900/70 backdrop-blur-sm border border-gray-800 hover:border-purple-700 text-gray-300"
            }`}
          >
            Bought by Me ({boughtPrompts.length})
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-4 py-20 text-gray-300">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            Loading your prompts...
          </div>
        ) : activeTab === "created" ? (
          createdPrompts.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-gray-300 text-xl mb-4">You haven't created any prompts yet.</p>
              <a href="/create" className="inline-block bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 px-8 py-4 rounded-2xl font-semibold transition-all shadow-lg shadow-purple-900/30">
                Create Your First Prompt
              </a>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {createdPrompts.map(p => <PromptCard key={p.tokenId} p={p} showReveal={false} />)}
            </div>
          )
        ) : (
          boughtPrompts.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-gray-300 text-xl mb-4">You haven't purchased any prompts yet.</p>
              <a href="/" className="inline-block bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 px-8 py-4 rounded-2xl font-semibold transition-all shadow-lg shadow-purple-900/30">
                Browse Marketplace
              </a>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {boughtPrompts.map(p => <PromptCard key={p.tokenId} p={p} showReveal={true} />)}
            </div>
          )
        )}
      </div>

      <ToastModal {...toast} onClose={() => setToast({ message: "" })} />
    </div>
  );
}