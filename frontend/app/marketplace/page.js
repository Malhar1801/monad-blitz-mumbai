'use client';

import { useEffect, useState, useCallback } from 'react';
import PromptCard from '@/components/PromptCard';
import { getMarketplace, findPrompts } from '@/lib/api';

export default function MarketplacePage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [error, setError] = useState('');

  const fetchListings = useCallback(() => {
    setLoading(true);
    getMarketplace()
      .then(d => setListings(d.listings || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) { setSearchResults(null); return; }
    setSearching(true);
    setError('');
    try {
      const data = await findPrompts(query.trim());
      setSearchResults(data.matches || []);
    } catch (e) {
      setError(e.message);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }

  function clearSearch() {
    setQuery('');
    setSearchResults(null);
    setError('');
  }

  const displayList = searchResults ?? listings;
  const isSearchActive = searchResults !== null;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-8">
        <span className="font-mono text-xs font-bold px-3 py-1 border-2 border-black bg-black text-cream">
          MARKETPLACE
        </span>
        <h1 className="font-mono font-black text-4xl mt-4">VERIFIED PROMPTS.</h1>
        <p className="font-mono text-gray-500 mt-2">Every listing scored by 4 AI agents. Minimum 70/100 to list.</p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-0 border-2 border-black shadow-brutal">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Describe what you need in plain English..."
            className="flex-1 font-mono text-sm px-4 py-3 bg-white border-r-2 border-black outline-none focus:bg-purple focus:bg-opacity-5"
          />
          <button
            type="submit"
            disabled={searching}
            className="font-mono font-bold text-sm px-6 py-3 bg-purple text-white hover:bg-black transition-colors disabled:opacity-50"
          >
            {searching ? 'SEARCHING...' : 'FIND WITH AI →'}
          </button>
          {isSearchActive && (
            <button
              type="button"
              onClick={clearSearch}
              className="font-mono font-bold text-sm px-4 py-3 bg-cream text-black border-l-2 border-black hover:bg-red-100 transition-colors"
            >
              ✕ CLEAR
            </button>
          )}
        </div>
      </form>

      {/* Search status banner */}
      {searching && (
        <div className="mb-6 border-2 border-black bg-yellow-100 p-4 flex items-center gap-3">
          <div className="w-3 h-3 bg-yellow-400 border-2 border-black animate-pulse" />
          <span className="font-mono font-bold text-sm">FILTER AGENT SEARCHING... embedding your query</span>
        </div>
      )}

      {isSearchActive && !searching && (
        <div className="mb-6 border-2 border-black bg-purple bg-opacity-10 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-bold">
              FILTER AGENT RESULTS — top {displayList.length} matches for:
            </span>
            <span className="font-mono text-sm text-purple italic">"{query}"</span>
          </div>
          {displayList.length > 0 && (
            <div className="flex gap-2">
              {displayList.map((m, i) => (
                <span key={i} className="font-mono text-xs px-2 py-1 border-2 border-black bg-white">
                  #{i + 1} — {(m.rankScore * 100).toFixed(0)}% match
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 border-2 border-red-400 bg-red-50 p-4">
          <p className="font-mono text-sm text-red-600 font-bold">Error: {error}</p>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="border-2 border-black h-64 bg-white animate-pulse" />
          ))}
        </div>
      ) : displayList.length === 0 ? (
        <div className="border-2 border-black p-16 text-center bg-white">
          <p className="font-mono text-gray-400 text-lg">
            {isSearchActive ? 'No matches found for your query.' : 'No prompts listed yet.'}
          </p>
          {isSearchActive && (
            <button onClick={clearSearch} className="font-mono text-sm mt-4 text-purple underline">
              Show all listings
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {displayList.map((p, i) => (
            <div key={p.tokenId ?? i} className="relative">
              {isSearchActive && (
                <div className="absolute -top-3 -left-1 z-10 font-mono text-xs font-bold px-2 py-0.5 bg-purple text-white border-2 border-black">
                  #{i + 1} MATCH
                </div>
              )}
              <PromptCard prompt={p} onBuySuccess={fetchListings} />
            </div>
          ))}
        </div>
      )}

      {/* Stats bar */}
      <div className="mt-12 border-2 border-black grid grid-cols-3 divide-x-2 divide-black bg-black text-cream">
        <div className="p-4 text-center">
          <p className="font-mono font-black text-2xl">{listings.length}</p>
          <p className="font-mono text-xs text-gray-400">TOTAL LISTINGS</p>
        </div>
        <div className="p-4 text-center">
          <p className="font-mono font-black text-2xl">4</p>
          <p className="font-mono text-xs text-gray-400">AGENTS PER PROMPT</p>
        </div>
        <div className="p-4 text-center">
          <p className="font-mono font-black text-2xl">70+</p>
          <p className="font-mono text-xs text-gray-400">MIN SCORE TO LIST</p>
        </div>
      </div>
    </div>
  );
}
