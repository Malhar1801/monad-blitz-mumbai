import { useEffect, useState } from "react";
import { ethers } from "ethers";
import axios from "axios";
import Navbar from "../components/navbar";
import { getContract, getProvider } from "../utils/contract";

export default function MyPrompts() {
  const [account, setAccount] = useState(null);
  const [myPrompts, setMyPrompts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [revealed, setRevealed] = useState({});
  const [rating, setRating] = useState({});

  const connectWallet = async () => {
    if (!window.ethereum) return alert("Install MetaMask!");
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const addr = await provider.getSigner().getAddress();
    setAccount(addr);
    loadMyPrompts(addr);
  };

  const loadMyPrompts = async (addr) => {
    setLoading(true);
    try {
      const provider = getProvider();
      if (!provider) return;
      await provider.send("eth_requestAccounts", []);
      const myAddress = addr || await provider.getSigner().getAddress();
      const contract = await getContract();
      const ids = await contract.getAllPrompts();
      const mine = (await Promise.all(ids.map(async (id) => {
        const owner = await contract.ownerOf(id);
        if (owner.toLowerCase() !== myAddress.toLowerCase()) return null;
        const d = await contract.getPromptDetails(id);
        return {
          tokenId: id.toString(),
          price: ethers.utils.formatEther(d.price),
          category: d.category,
          avgRating: d.avgRating.toString()
        };
      }))).filter(Boolean);
      setMyPrompts(mine);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const reveal = async (tokenId) => {
    try {
      const contract = await getContract(true);
      const ipfsHash = await contract.revealPrompt(tokenId);
      const res = await axios.get(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`);
      setRevealed(prev => ({ ...prev, [tokenId]: res.data }));
    } catch (err) { alert("Error: " + (err.reason || err.message)); }
  };

  const submitRating = async (tokenId) => {
    const r = Number(rating[tokenId]);
    if (!r || r < 1 || r > 5) return alert("Rate between 1-5");
    try {
      const contract = await getContract(true);
      const tx = await contract.ratePrompt(tokenId, r);
      await tx.wait();
      alert("Rating submitted!");
    } catch (err) { alert("Error: " + (err.reason || err.message)); }
  };

  if (!account) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <Navbar onConnect={setAccount} />
        <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6">
          <div className="text-6xl">🔐</div>
          <h1 className="text-3xl font-bold text-purple-400">My Prompts</h1>
          <p className="text-gray-400">Connect your wallet to see prompts you own</p>
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
        <p className="text-gray-400 mb-8">Prompts you own — reveal and use them anytime</p>

        {loading ? (
          <div className="flex items-center gap-3 text-gray-400">
            <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            Loading your prompts...
          </div>
        ) : myPrompts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">You don't own any prompts yet.</p>
            <a href="/" className="text-purple-400 hover:text-purple-300 mt-2 inline-block">
              Browse marketplace →
            </a>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {myPrompts.map(p => (
              <div key={p.tokenId} className="bg-gray-900 border border-purple-900 rounded-xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex gap-2">
                    <span className="bg-purple-900 text-purple-300 text-xs px-2 py-1 rounded">#{p.tokenId}</span>
                    <span className="bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded">{p.category}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-yellow-400 text-sm">⭐ {p.avgRating}/5</span>
                    <span className="text-purple-400 font-bold">{p.price} MON</span>
                  </div>
                </div>

                {revealed[p.tokenId] ? (
                  <div className="bg-gray-800 rounded-lg p-4 mb-4">
                    <p className="text-purple-300 font-semibold mb-2">{revealed[p.tokenId].title}</p>
                    <p className="text-gray-300 text-sm leading-relaxed">{revealed[p.tokenId].prompt}</p>
                  </div>
                ) : (
                  <button onClick={() => reveal(p.tokenId)}
                    className="w-full bg-purple-600 hover:bg-purple-500 py-2.5 rounded-lg font-semibold text-sm mb-4 transition">
                    🔓 Reveal Prompt
                  </button>
                )}

                <div className="flex gap-2">
                  <input type="number" min="1" max="5" placeholder="Rate 1-5"
                    value={rating[p.tokenId] || ""}
                    onChange={e => setRating(prev => ({ ...prev, [p.tokenId]: e.target.value }))}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm w-24 focus:outline-none focus:border-purple-500" />
                  <button onClick={() => submitRating(p.tokenId)}
                    className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm transition">
                    Submit Rating
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}