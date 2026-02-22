import { useEffect, useState } from "react";
import { ethers } from "ethers";
import axios from "axios";
import Navbar from "../components/navbar";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../utils/contract";

export default function MyPrompts() {
  const [account, setAccount] = useState(null);
  const [createdPrompts, setCreatedPrompts] = useState([]);
  const [boughtPrompts, setBoughtPrompts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [revealed, setRevealed] = useState({});
  const [rating, setRating] = useState({});
  const [activeTab, setActiveTab] = useState("created");

  const connectWallet = async () => {
    if (!window.ethereum) return alert("Install MetaMask!");
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
      const myAddress = (await signer.getAddress()).toLowerCase();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

      const ids = await contract.getAllPrompts();
      console.log("Total prompts:", ids.length);

      const created = [];
      const bought = [];

      // Sequential loop instead of Promise.all to avoid RPC rate limiting
      // on Monad testnet which causes silent failures
      for (const id of ids) {
        try {
          const [owner, d, rawPrompt] = await Promise.all([
            contract.ownerOf(id),
            contract.getPromptDetails(id),
            contract.prompts(id),
          ]);

          const ipfsHash = rawPrompt.ipfsHash;
          const creator = d.creator.toLowerCase();
          const ownerAddr = owner.toLowerCase();

          const iAmOwner = ownerAddr === myAddress;
          const iAmCreator = creator === myAddress;

          // Skip if I have no relation to this prompt
          if (!iAmOwner && !iAmCreator) continue;

          let title = "Untitled Prompt";
          try {
            const res = await axios.get(
              `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
              { timeout: 8000 }
            );
            title = res.data?.title || "Untitled Prompt";
          } catch (e) {}

          const promptData = {
            tokenId: id.toString(),
            price: ethers.utils.formatEther(d.price),
            category: d.category,
            avgRating: d.avgRating.toString(),
            ipfsHash,
            title,
            creator: d.creator,
            owner,
          };

          // These are two separate conditions (not else if)
          // A prompt can appear in created AND bought (if you bought your own back)
          if (iAmCreator) {
            created.push(promptData);
          }

          if (iAmOwner && !iAmCreator) {
            // I own it but didn't create it — meaning I bought it from someone else
            bought.push(promptData);
          }

        } catch (e) {
          console.log("Error on token", id.toString(), e.message);
        }
      }

      console.log("Created:", created.length, "Bought:", bought.length);
      setCreatedPrompts(created);
      setBoughtPrompts(bought);
    } catch (err) {
      console.error("Error loading prompts:", err);
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
      alert("Error fetching prompt: " + err.message);
    }
  };

  const submitRating = async (tokenId) => {
    const r = Number(rating[tokenId]);
    if (!r || r < 1 || r > 5) return alert("Rate between 1-5");
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.ratePrompt(tokenId, r);
      await tx.wait();
      alert("Rating submitted!");
    } catch (err) {
      alert("Error: " + (err.reason || err.message));
    }
  };

  const PromptCard = ({ p, showReveal }) => (
    <div className="bg-gray-900 border border-purple-900 rounded-xl p-6">
      <div className="flex justify-between items-center mb-3">
        <div className="flex gap-2">
          <span className="bg-purple-900 text-purple-300 text-xs px-2 py-1 rounded">#{p.tokenId}</span>
          <span className="bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded">{p.category}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-yellow-400 text-sm">⭐ {p.avgRating}/5</span>
          <span className="text-purple-400 font-bold">{p.price} MON</span>
        </div>
      </div>

      <h3 className="text-white font-semibold text-lg mb-3">{p.title}</h3>

      <div className="mb-3">
        <p className="text-gray-500 text-xs">Creator</p>
        <p className="text-sm font-mono text-gray-300">
          {p.creator.slice(0, 6)}...{p.creator.slice(-4)}
        </p>
      </div>

      {showReveal && (
        revealed[p.tokenId] ? (
          <div className="bg-gray-800 rounded-lg p-4 mb-4 border border-purple-800">
            <p className="text-purple-300 text-xs mb-2 uppercase tracking-wide">Full Prompt</p>
            <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
              {revealed[p.tokenId].prompt}
            </p>
          </div>
        ) : (
          <button
            onClick={() => reveal(p.tokenId, p.ipfsHash)}
            className="w-full bg-purple-600 hover:bg-purple-500 py-2.5 rounded-lg font-semibold text-sm mb-4 transition"
          >
            🔓 Reveal Full Prompt
          </button>
        )
      )}

      <div className="flex gap-2 mt-2">
        <input
          type="number" min="1" max="5" placeholder="Rate 1-5"
          value={rating[p.tokenId] || ""}
          onChange={e => setRating(prev => ({ ...prev, [p.tokenId]: e.target.value }))}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm w-24 focus:outline-none focus:border-purple-500"
        />
        <button
          onClick={() => submitRating(p.tokenId)}
          className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm transition"
        >
          Submit Rating
        </button>
      </div>
    </div>
  );

  if (!account) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <Navbar onConnect={setAccount} />
        <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6">
          <div className="text-6xl">🔐</div>
          <h1 className="text-3xl font-bold text-purple-400">My Prompts</h1>
          <p className="text-gray-400">Connect your wallet to see your prompts</p>
          <button
            onClick={connectWallet}
            className="bg-purple-600 hover:bg-purple-500 px-8 py-4 rounded-xl font-bold text-lg transition"
          >
            🦊 Connect MetaMask
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar onConnect={setAccount} />
      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-4xl font-bold text-purple-400 mb-1">My Prompts</h1>
        <p className="text-gray-400 mb-6">Manage your created and purchased prompts</p>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setActiveTab("created")}
            className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition ${
              activeTab === "created"
                ? "bg-purple-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            ✍️ Created by Me ({createdPrompts.length})
          </button>
          <button
            onClick={() => setActiveTab("bought")}
            className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition ${
              activeTab === "bought"
                ? "bg-purple-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            🛒 Bought by Me ({boughtPrompts.length})
          </button>
        </div>

        {loading ? (
          <div className="flex items-center gap-3 text-gray-400">
            <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            Loading your prompts...
          </div>
        ) : activeTab === "created" ? (
          createdPrompts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-400 text-lg mb-2">You haven't created any prompts yet.</p>
              <a href="/create" className="text-purple-400 hover:text-purple-300">
                Create your first prompt →
              </a>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {createdPrompts.map(p => (
                <PromptCard key={p.tokenId} p={p} showReveal={false} />
              ))}
            </div>
          )
        ) : (
          boughtPrompts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-400 text-lg mb-2">You haven't bought any prompts yet.</p>
              <a href="/" className="text-purple-400 hover:text-purple-300">
                Browse marketplace →
              </a>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {boughtPrompts.map(p => (
                <PromptCard key={p.tokenId} p={p} showReveal={true} />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}