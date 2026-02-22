import { useState } from "react";
import axios from "axios";
import { ethers } from "ethers";
import Navbar from "../components/navbar";
import ToastModal from "../components/ToastModal";
import { getContract } from "../utils/contract";

const CATEGORIES = ["ChatGPT", "Coding", "Design", "Marketing", "Other"];

export default function Create() {
  const [account, setAccount] = useState(null);
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("ChatGPT");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("");

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

  const uploadToIPFS = async () => {
    try {
      const res = await axios.post(
        "https://api.pinata.cloud/pinning/pinJSONToIPFS",
        {
          pinataContent: {
            title,
            prompt,
            category,
            createdAt: new Date().toISOString(),
          },
        },
        {
          headers: {
            pinata_api_key: process.env.NEXT_PUBLIC_PINATA_API_KEY,
            pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_SECRET,
          },
        }
      );
      return res.data.IpfsHash;
    } catch (err) {
      throw new Error("IPFS upload failed");
    }
  };

  const handleCreate = async () => {
    if (!title.trim() || !prompt.trim() || !price) {
      return showToast("Please fill in all required fields", "error");
    }

    try {
      setLoading(true);
      setStep("Uploading metadata to IPFS...");
      const ipfsHash = await uploadToIPFS();

      setStep("Minting NFT on-chain...");
      const contract = await getContract(true);
      const tx = await contract.createPrompt(
        ipfsHash,
        ethers.utils.parseEther(price),
        category
      );
      await tx.wait();

      setStep("Success!");
      showToast("Prompt minted successfully as NFT", "success");

      setTitle("");
      setPrompt("");
      setPrice("");
      setCategory("ChatGPT");
    } catch (err) {
      showToast(err.reason || err.message || "Failed to mint prompt", "error");
    } finally {
      setLoading(false);
      setStep("");
    }
  };

  if (!account) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-black to-gray-950 text-white">
        <Navbar onConnect={setAccount} />
        <div className="flex flex-col items-center justify-center min-h-[80vh] gap-8 px-6">
          <h1 className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400">
            Create Prompt NFT
          </h1>
          <p className="text-gray-400 text-xl max-w-md text-center">
            Mint your AI prompt and list it for sale on-chain
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
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400 mb-2">
          Create Prompt NFT
        </h1>
        <p className="text-gray-400 mb-10 text-lg">
          Turn your AI prompt into a collectible and sellable asset
        </p>

        <div className="bg-gradient-to-br from-gray-900 via-gray-950 to-black border border-purple-900/50 rounded-2xl p-8 shadow-xl shadow-purple-950/20">
          <div className="space-y-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2 font-medium">Title</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Advanced React Component Generator"
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-5 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/40 transition"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2 font-medium">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-5 py-3.5 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/40 transition"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2 font-medium">Prompt</label>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                rows={7}
                placeholder="Write the complete prompt you want to mint..."
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-5 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/40 transition resize-none"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2 font-medium">Price (MON)</label>
              <input
                type="number"
                step="0.001"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="0.05"
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-5 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/40 transition"
              />
            </div>

            {step && (
              <div className="bg-purple-950/70 backdrop-blur-sm border border-purple-800/40 rounded-xl px-5 py-4 text-purple-200 text-sm">
                {step}
              </div>
            )}

            <div className="bg-gray-900/70 backdrop-blur-sm border border-gray-800 rounded-xl px-5 py-4 text-sm">
              <p className="text-gray-400">Connected wallet</p>
              <p className="text-purple-300 font-mono mt-1">
                {account.slice(0, 6)}…{account.slice(-4)}
              </p>
            </div>

            <button
              onClick={handleCreate}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed py-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-purple-900/30 disabled:shadow-none"
            >
              {loading ? "Processing..." : "Mint Prompt NFT"}
            </button>
          </div>
        </div>
      </div>

      <ToastModal {...toast} onClose={() => setToast({ message: "" })} />
    </div>
  );
}