import { useEffect, useState } from "react";
import { ethers } from "ethers";
import axios from "axios";
import Navbar from "../components/navbar";
import ToastModal from "../components/ToastModal";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../utils/contract";

const CATEGORIES = ["All", "ChatGPT", "Coding", "Design", "Marketing", "Other"];

export default function Marketplace() {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("All");
  const [buying, setBuying] = useState(null);
  const [account, setAccount] = useState(null);

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
    if (account) loadPrompts();
  }, [account]);

  const loadPrompts = async () => {
    setLoading(true);
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

      const ids = await contract.getAllPrompts();

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
              ? res.data.prompt.slice(0, 100) + (res.data.prompt.length > 100 ? "..." : "")
              : "";
          } catch {}

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
        } catch {
          return null;
        }
      }));

      const active = list.filter(Boolean).filter(p => p.active);
      setPrompts(active);
    } catch (err) {
      console.error(err);
      showToast("Failed to load marketplace. Please try again.", "error");
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
      showToast("Purchase successful! View it in My Prompts.", "success");
      loadPrompts();
    } catch (err) {
      showToast(err.reason || "Transaction failed", "error");
    } finally {
      setBuying(null);
    }
  };

  const filtered =
    filter === "All" ? prompts : prompts.filter(p => p.category === filter);

  if (!account) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-black to-gray-950 text-white">
        <Navbar onConnect={setAccount} />
        <div className="flex flex-col items-center justify-center min-h-[80vh] gap-8 px-6">
          <h1 className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400">
            Prompt Marketplace
          </h1>
          <p className="text-gray-400 text-xl max-w-lg text-center">
            Discover and own unique AI prompts as NFTs on Monad
          </p>
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
      <div className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400 mb-2">
          AI Prompt Marketplace
        </h1>
        <p className="text-gray-400 mb-10 text-lg">
          Buy and own AI prompts forever as NFTs on Monad
        </p>

        <div className="flex gap-2.5 mb-10 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-6 py-2.5 rounded-full text-sm font-medium tracking-wide transition-all ${
                filter === cat
                  ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md shadow-purple-900/40"
                  : "bg-gray-900/70 backdrop-blur-sm border border-gray-800 hover:border-purple-700 text-gray-300 hover:shadow-sm"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-4 py-20 text-gray-300">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            Loading prompts...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400 text-lg">
            No prompts available yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(p => (
              <div
                key={p.tokenId}
                className="group relative bg-gradient-to-br from-gray-900 via-gray-950 to-black border border-purple-900/50 rounded-2xl p-6 shadow-lg shadow-purple-950/20 hover:shadow-purple-900/40 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/10 to-cyan-900/10 opacity-0 group-hover:opacity-60 rounded-2xl transition-opacity pointer-events-none"></div>

                <div className="relative flex justify-between items-start mb-4">
                  <span className="bg-purple-950/70 backdrop-blur-sm text-purple-300 text-xs px-3 py-1 rounded-full border border-purple-800/40">
                    #{p.tokenId}
                  </span>
                  <span className="bg-gray-800/70 backdrop-blur-sm text-gray-300 text-xs px-3 py-1 rounded-full border border-gray-700/50">
                    {p.category}
                  </span>
                </div>

                <h3 className="text-white font-semibold text-xl mb-2 line-clamp-2">{p.title}</h3>

                {p.description && (
                  <p className="text-gray-400 text-sm mb-4 leading-relaxed line-clamp-3">
                    {p.description}
                  </p>
                )}

                <div className="mb-5">
                  <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Creator</p>
                  <p className="text-sm font-mono text-gray-300">
                    {p.creator.slice(0, 6)}…{p.creator.slice(-4)}
                  </p>
                </div>

                <div className="flex justify-between items-center mb-6">
                  <p className="text-2xl font-bold text-cyan-400">{p.price} MON</p>
                  <p className="text-yellow-400/90 text-sm font-medium">★ {p.avgRating}/5</p>
                </div>

                <button
                  onClick={() => buy(p.tokenId, p.price)}
                  disabled={buying === p.tokenId}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed py-3 rounded-xl font-semibold text-sm tracking-wide transition-all shadow-md hover:shadow-lg hover:shadow-purple-900/40 disabled:shadow-none"
                >
                  {buying === p.tokenId ? "Processing..." : "Buy Prompt"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <ToastModal {...toast} onClose={() => setToast({ message: "" })} />
    </div>
  );
}