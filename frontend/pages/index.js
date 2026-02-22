import { useEffect, useState } from "react";
import { ethers } from "ethers";
import Navbar from "../components/navbar";
import { getContract, getProvider } from "../utils/contract";

const CATEGORIES = ["All", "ChatGPT", "Coding", "Design", "Marketing", "Other"];

export default function Marketplace() {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("All");
  const [buying, setBuying] = useState(null);
  const [account, setAccount] = useState(null);

  const connectWallet = async () => {
    if (!window.ethereum) return alert("Please install MetaMask!");
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const addr = await provider.getSigner().getAddress();
    setAccount(addr);
    loadPrompts();
  };

  const loadPrompts = async () => {
    setLoading(true);
    try {
      const contract = await getContract();
      const ids = await contract.getAllPrompts();
      const list = await Promise.all(ids.map(async (id) => {
        const d = await contract.getPromptDetails(id);
        const owner = await contract.ownerOf(id);
        return {
          tokenId: id.toString(),
          price: ethers.utils.formatEther(d.price),
          creator: d.creator,
          active: d.active,
          category: d.category,
          avgRating: d.avgRating.toString(),
          owner,
        };
      }));
      setPrompts(list.filter(p => p.active));
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const buy = async (tokenId, price) => {
    try {
      setBuying(tokenId);
      const contract = await getContract(true);
      const tx = await contract.buyPrompt(tokenId, { value: ethers.utils.parseEther(price) });
      await tx.wait();
      alert("🎉 Purchased! Go to My Prompts to reveal.");
      loadPrompts();
    } catch (err) { alert("Error: " + (err.reason || err.message)); }
    setBuying(null);
  };

  const filtered = filter === "All" ? prompts : prompts.filter(p => p.category === filter);

  // Show connect wallet screen if not connected
  if (!account) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <Navbar onConnect={setAccount} />
        <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6">
          <div className="text-6xl">⚡</div>
          <h1 className="text-4xl font-bold text-purple-400">Welcome to PromptFi</h1>
          <p className="text-gray-400 text-lg">The decentralized AI prompt marketplace on Monad</p>
          <p className="text-gray-500">Connect your wallet to browse and buy prompts</p>
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
      <div className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-4xl font-bold text-purple-400 mb-1">AI Prompt Marketplace</h1>
        <p className="text-gray-400 mb-6">Buy AI prompts as NFTs on Monad. Own them forever.</p>

        <div className="flex gap-2 mb-8 flex-wrap">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${filter === cat ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center gap-3 text-gray-400">
            <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            Loading prompts...
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-gray-400">No prompts yet. Be the first to create one!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(p => (
              <div key={p.tokenId} className="bg-gray-900 border border-purple-900 rounded-xl p-6 flex flex-col gap-3">
                <div className="flex justify-between">
                  <span className="bg-purple-900 text-purple-300 text-xs px-2 py-1 rounded">#{p.tokenId}</span>
                  <span className="bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded">{p.category}</span>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Creator</p>
                  <p className="text-sm font-mono">{p.creator.slice(0,6)}...{p.creator.slice(-4)}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-2xl font-bold text-purple-400">{p.price} MON</p>
                  <p className="text-yellow-400 text-sm">⭐ {p.avgRating}/5</p>
                </div>
                <button onClick={() => buy(p.tokenId, p.price)} disabled={buying === p.tokenId}
                  className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:cursor-not-allowed py-2.5 rounded-lg font-semibold text-sm transition">
                  {buying === p.tokenId ? "Processing..." : "Buy & Unlock ⚡"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}