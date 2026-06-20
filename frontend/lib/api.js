const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

// ── Marketplace ────────────────────────────────────────────────────────────────
export async function getMarketplace() {
  return apiFetch('/api/marketplace');
}

// ── Buyer ─────────────────────────────────────────────────────────────────────
export async function findPrompts(query) {
  return apiFetch('/api/buyer/find', {
    method: 'POST',
    body: JSON.stringify({ query }),
  });
}

// ── Training ──────────────────────────────────────────────────────────────────
export async function getChallenges() {
  return apiFetch('/api/training/challenges');
}

export async function getTrainingProgress(wallet) {
  return apiFetch(`/api/training/progress/${wallet}`);
}

export async function submitTraining(walletAddress, challengeId, promptText) {
  return apiFetch('/api/training/submit', {
    method: 'POST',
    body: JSON.stringify({ walletAddress, challengeId, promptText }),
  });
}

// ── Account ───────────────────────────────────────────────────────────────────
export async function getAccount(wallet) {
  return apiFetch(`/api/account/${wallet}`);
}

// ── Mint ──────────────────────────────────────────────────────────────────────
export async function mintPrompt(walletAddress, promptText, problemStatement, category, price) {
  return apiFetch('/api/mint', {
    method: 'POST',
    body: JSON.stringify({ walletAddress, promptText, problemStatement, category, price }),
  });
}
