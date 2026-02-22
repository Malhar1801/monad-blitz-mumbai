import { useState } from "react";
import axios from "axios";
import { ethers } from "ethers";
import Navbar from "../components/navbar";
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

  const connectWallet = async () => {
    if (!window.ethereum) return alert("Install MetaMask!");
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const addr = await provider.getSigner().getAddress();
    setAccount(addr);
  };

  const uploadToIPFS = async () => {
    const res = await axios.post(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      { pinataContent: { title, prompt, category, createdAt: new Date().toISOString() } },
      { headers: {
        pinata_api_key: process.env.NEXT_PUBLIC_PINATA_API_KEY,
        pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_SECRET,
      }}
    );
    return res.data.IpfsHash;
  };

  const handleCreate = async () => {
    if (!title || !prompt || !price) return alert("Fill all fields!");
    try {
      setLoading(true);
      setStep("📤 Uploading to IPFS...");
      const ipfsHash = await uploadToIPFS();
      setStep("⛏️ Minting NFT on Monad...");
      const contract = await getContract(true);
      const tx = await contract.createPrompt(ipfsHash, ethers.utils.parseEther(price), category);
      await tx.wait();
      setStep("✅ Minted successfully!");
      alert("Prompt minted as NFT!");
      setTitle(""); setPrompt(""); setPrice("");
    } catch (err) { alert("Error: " + (err.reason || err.message)); }
    setLoading(false); setStep("");
  };

  if (!account) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <Navbar onConnect={setAccount} />
        <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6">
          <div className="text-6xl">✍️</div>
          <h1 className="text-3xl font-bold text-purple-400">Create a Prompt NFT</h1>
          <p className="text-gray-400">Connect your wallet to mint and sell your AI prompts</p>
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
      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-4xl font-bold text-purple-400 mb-1">Create Prompt NFT</h1>
        <p className="text-gray-400 mb-8">Mint your AI prompt and sell it on-chain</p>
        <div className="bg-gray-900 border border-purple-900 rounded-xl p-8 flex flex-col gap-5">
          <div>
            <label className="text-sm text-gray-400 block mb-2">Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Perfect SEO Blog Writer"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500" />
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-2">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500">
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-2">Your Prompt</label>
            <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={6}
              placeholder="Write your full AI prompt here..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 resize-none" />
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-2">Price (MON)</label>
            <input type="number" value={price} onChange={e => setPrice(e.target.value)}
              placeholder="e.g. 0.01"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500" />
          </div>
          {step && (
            <div className="bg-purple-950 border border-purple-700 rounded-lg px-4 py-3 text-purple-300 text-sm">
              {step}
            </div>
          )}
          <div className="bg-gray-800 rounded-lg px-4 py-3 text-sm">
            <p className="text-gray-400">Connected as</p>
            <p className="text-purple-300 font-mono">{account.slice(0,6)}...{account.slice(-4)}</p>
          </div>
          <button onClick={handleCreate} disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:cursor-not-allowed py-3 rounded-lg font-bold text-lg transition">
            {loading ? "Processing..." : "Mint as NFT ⚡"}
          </button>
        </div>
      </div>
    </div>
  );
}