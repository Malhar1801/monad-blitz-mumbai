# PromptFi

> **A decentralised prompt engineering marketplace on Monad Testnet.**  
> Creators train to earn on-chain Expert status, then mint their best prompts as NFTs. Buyers discover and purchase prompts semantically — all settled in MON, all verifiable on-chain.

![Monad Testnet](https://img.shields.io/badge/Network-Monad%20Testnet-7c3aed?style=flat-square)
![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636?style=flat-square&logo=solidity)
![Next.js](https://img.shields.io/badge/Frontend-Next.js%2014-black?style=flat-square&logo=next.js)
![Node.js](https://img.shields.io/badge/Backend-Node.js-339933?style=flat-square&logo=node.js)
![MongoDB](https://img.shields.io/badge/VectorDB-MongoDB-47A248?style=flat-square&logo=mongodb)
![IPFS](https://img.shields.io/badge/Storage-IPFS%20via%20Pinata-65C2CB?style=flat-square)

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Smart Contracts](#smart-contracts)
- [AI Agent Pipeline](#ai-agent-pipeline)
- [Project Structure](#project-structure)
- [Deployed Contracts](#deployed-contracts)
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Running Locally](#running-locally)
- [Scripts Reference](#scripts-reference)
- [API Reference](#api-reference)
- [Frontend Pages](#frontend-pages)
- [User Flow](#user-flow)
- [Tech Stack](#tech-stack)

---

## Overview

PromptFi solves a core problem in the AI era: **great prompts are valuable intellectual property**, but there's no trusted marketplace for them.

PromptFi creates a trust-minimised prompt marketplace where:

- **Quality is enforced** — every prompt is scored by 4 independent AI agents before it can be listed. Minimum score: 70/100.
- **Expertise is earned** — creators must prove prompt engineering skill via graded challenges before they can mint. Expert status is stored on-chain.
- **Ownership is on-chain** — each prompt is an ERC-721 NFT on Monad. Metadata lives on IPFS. Nothing is controlled by a central server.
- **Discovery is semantic** — buyers describe what they need in plain English. A vector embedding agent finds the best matching prompts.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER (Browser / MetaMask)                    │
└──────────────┬──────────────────────────────────┬───────────────────┘
               │ REST API                          │ Direct contract calls
               ▼                                  ▼
┌──────────────────────────┐         ┌─────────────────────────────────┐
│   Node.js + Express      │         │        Monad Testnet (EVM)      │
│   Backend (port 5000)    │         │                                 │
│                          │         │  ┌──────────────────────────┐   │
│  ┌────────────────────┐  │         │  │    TrainingRegistry.sol  │   │
│  │  AI Agent Pipeline │  │────────▶️│  │  (scores, expert status) │   │
│  │  ┌──────────────┐  │  │         │  └──────────────────────────┘   │
│  │  │ Clarity      │  │  │         │                                 │
│  │  │ Structure    │  │  │         │  ┌──────────────────────────┐   │
│  │  │ Originality  │  │  │         │  │       PromptNFT.sol      │   │
│  │  │ OutputQuality│  │  │         │  │  ERC-721 + marketplace   │   │
│  │  │ Aggregator   │  │  │         │  │  mint / list / buy       │   │
│  │  └──────────────┘  │  │         │  └──────────────────────────┘   │
│  └────────────────────┘  │         └─────────────────────────────────┘
│                          │
│  ┌────────────────────┐  │         ┌─────────────────────────────────┐
│  │  Services          │  │────────▶️│         Pinata IPFS             │
│  │  - contractService │  │         │  Prompt metadata + scores JSON  │
│  │  - ipfsService     │  │         └─────────────────────────────────┘
│  │  - embeddingService│  │
│  └────────────────────┘  │         ┌─────────────────────────────────┐
│                          │────────▶️│     MongoDB (local)             │
│  ┌────────────────────┐  │         │  PromptEmbedding collection     │
│  │  Routes            │  │         │  (vector embeddings for search) │
│  │  /training         │  │         └─────────────────────────────────┘
│  │  /mint             │  │
│  │  /marketplace      │  │         ┌─────────────────────────────────┐
│  │  /buyer            │  │         │   Google Gemini 2.0 Flash       │
│  │  /account          │  │────────▶️│   (AI evaluation + generation)  │
│  └────────────────────┘  │         └─────────────────────────────────┘
└──────────────────────────┘
               ▲
               │
┌──────────────────────────┐
│   Next.js 14 Frontend    │
│   (port 3000)            │
│                          │
│  /           Landing     │
│  /marketplace Listings   │
│  /training   Challenges  │
│  /mint       NFT minting │
│  /account    Profile     │
└──────────────────────────┘
```

### Data Flow — Minting a Prompt

```
Creator writes prompt
        │
        ▼
POST /api/mint
        │
        ├──▶️ 4 AI agents run in Promise.all()
        │       ├── Clarity Agent    (Gemini: score 0-100)
        │       ├── Structure Agent  (Gemini: score 0-100)
        │       ├── Originality Agent (embed → cosine sim → Gemini feedback)
        │       └── Output Quality Agent (Gemini: generate → judge)
        │
        ├──▶️ Aggregator: overallScore = weighted avg
        │
        ├──▶️ overallScore < 70 → REJECT (return feedback, no mint)
        │
        ├──▶️ overallScore ≥ 70
        │       ├── Upload metadata JSON → Pinata IPFS → get CID
        │       ├── PromptNFT.mintPrompt(creator, ipfsHash, scores, price)
        │       │       → ERC-721 token minted on Monad
        │       └── Store embedding in MongoDB (for semantic search)
        │
        └──▶️ Return { tokenId, ipfsHash, evaluation }
```

### Data Flow — Buying a Prompt

```
Buyer describes need in plain English
        │
        ▼
POST /api/buyer/find
        │
        ├──▶️ Embed query → Xenova/all-MiniLM-L6-v2 (local, no API cost)
        ├──▶️ Fetch all PromptEmbeddings from MongoDB
        ├──▶️ Cosine similarity against each stored embedding
        ├──▶️ rankScore = (similarity × 0.6) + (overallScore/100 × 0.4)
        └──▶️ Return top 3 sorted by rankScore
                │
                ▼
        Buyer clicks "BUY WITH WALLET"
                │
                ▼
        Frontend calls PromptNFT.buyPrompt(tokenId, { value: price })
                │    directly via MetaMask (no backend involved)
                ▼
        ERC-721 transfer on Monad + MON payment to seller
```

---

## Smart Contracts

### `TrainingRegistry.sol`

Tracks every wallet's challenge attempt history and auto-grants Expert status.

| Function | Access | Description |
|---|---|---|
| `logChallengeAttempt(wallet, challengeId, score)` | `onlyOwner` | Logs a graded attempt for a wallet |
| `getAverageScore(wallet)` | `public view` | Weighted avg across all attempts |
| `checkAndSetExpert(wallet)` | `external` | Sets `isExpert = true` if avg ≥ 75 |
| `isExpertWallet(wallet)` | `external view` | Read expert status |
| `getAttemptCount(wallet)` | `external view` | Number of graded attempts |

```solidity
struct ChallengeAttempt {
    uint256 challengeId;
    uint256 score;
    uint256 timestamp;
}
mapping(address => ChallengeAttempt[]) public attempts;
mapping(address => bool) public isExpert;
```

### `PromptNFT.sol`

ERC-721 marketplace. Each token stores 5 AI-generated scores + full listing state.

| Function | Access | Description |
|---|---|---|
| `mintPrompt(ipfsHash, scores[4], price)` | Expert or Owner | Mints + auto-lists the NFT |
| `buyPrompt(tokenId)` | `payable` | Transfers token, pays seller in MON |
| `listPrompt(tokenId, price)` | Token owner | Re-list after purchase |
| `getPromptMetadata(tokenId)` | `public view` | Returns full scoring struct |
| `getAllListedTokenIds()` | `public view` | All currently listed tokenIds |

```solidity
struct PromptMetadata {
    string  ipfsHash;
    uint256 clarityScore;
    uint256 structureScore;
    uint256 originalityScore;
    uint256 outputScore;
    uint256 overallScore;
    bool    isVerified;
    address creatorWallet;
    uint256 price;         // in wei (MON)
    bool    isListed;
}
```

---

## AI Agent Pipeline

All 4 agents run concurrently via `Promise.all()` — total latency equals the **slowest single agent**, not their sum.

```
promptText
    │
    ├──────────────────────────────────────────────── Promise.all() ─┐
    │                                                                │
    ▼                    ▼                    ▼                    ▼ │
Clarity Agent      Structure Agent     Originality Agent    Output Quality Agent
    │                    │                    │                    │
1× Gemini call     1× Gemini call     1. Embed prompt       1. Gemini generates
                                       (local model)            output from prompt
Score: 0-100       Score: 0-100       2. Cosine sim vs      2. Gemini judges
Feedback: []       Feedback: []          MongoDB store          the output
                                       3. Gemini feedback
                                       Score: 0-100          Score: 0-100
                                       isPlagiarism: bool    generatedOutput: str
    │                    │                    │                    │
    └────────────────────┴────────────────────┴────────────────────┘
                                    │
                                    ▼
                              Aggregator.js
                    overallScore = avg(c + s + o + q)
                                    │
                         ┌──────────┴──────────┐
                         │                     │
                      < 70                  ≥ 70
                         │                     │
                       REJECT              APPROVED
                     (feedback)         (proceed to mint)
```

| Agent | File | Model | Scores |
|---|---|---|---|
| Clarity | `agents/clarityAgent.js` | Gemini 2.0 Flash | Specificity, unambiguity, intent clarity |
| Structure | `agents/structureAgent.js` | Gemini 2.0 Flash | Context, instructions, output format, flow |
| Originality | `agents/originalityAgent.js` | Local MiniLM + Gemini | Cosine similarity vs all stored prompts |
| Output Quality | `agents/outputQualityAgent.js` | Gemini 2.0 Flash (×2) | Usefulness, completeness, commercial viability |
| Aggregator | `agents/aggregator.js` | Pure math | Weighted average, compiles full result |
| Filter | `agents/filterAgent.js` | Local MiniLM | Semantic search + quality-weighted ranking |

**Embedding model:** `Xenova/all-MiniLM-L6-v2` — runs fully locally via `@xenova/transformers`. ~22 MB, auto-downloaded on first run. No API key or cost.

---

## Project Structure

```
PromptFi/
├── contracts/
│   ├── TrainingRegistry.sol     # Challenge tracking + Expert status
│   └── PromptNFT.sol            # ERC-721 marketplace
│
├── agents/
│   ├── clarityAgent.js          # Gemini: evaluates prompt clarity
│   ├── structureAgent.js        # Gemini: evaluates prompt structure
│   ├── originalityAgent.js      # MiniLM + Gemini: plagiarism + uniqueness
│   ├── outputQualityAgent.js    # Gemini×2: generate output → judge quality
│   ├── filterAgent.js           # MiniLM: semantic search + ranking
│   ├── aggregator.js            # Weighted average aggregation (pure math)
│   └── utils.js                 # Shared cosine similarity helper
│
├── routes/
│   ├── training.js              # POST /submit, GET /challenges, GET /progress
│   ├── mint.js                  # POST /mint (expert-only)
│   ├── marketplace.js           # GET /marketplace (on-chain + MongoDB merge)
│   ├── buyer.js                 # POST /buyer/find (semantic search)
│   └── account.js               # GET /account/:wallet (full profile)
│
├── services/
│   ├── contractService.js       # ethers.js v6 — contract instances
│   ├── ipfsService.js           # Pinata JWT — pin/fetch JSON on IPFS
│   └── embeddingService.js      # Xenova local embedding model
│
├── models/
│   └── PromptEmbedding.js       # Mongoose schema — vector store
│
├── scripts/
│   ├── deploy.js                # Hardhat deploy → writes config/addresses.json
│   ├── seedMarketplace.js       # Seeds 8 demo prompts (IPFS + mint + MongoDB)
│   ├── seedChallenges.js        # Seeds challenge list to challenges.json
│   ├── setExpert.js             # Dev tool: force Expert status for any wallet
│   └── preflight.js             # Checks all env vars + service connectivity
│
├── frontend/
│   ├── app/
│   │   ├── page.js              # Landing page
│   │   ├── marketplace/         # Browse + search + buy prompts
│   │   ├── training/            # Challenges + evaluation + progress
│   │   ├── mint/                # Expert prompt minting
│   │   └── account/             # Wallet profile + history
│   ├── components/
│   │   ├── Navbar.js            # MetaMask wallet panel + account dropdown
│   │   ├── PromptCard.js        # Marketplace listing card + buy flow
│   │   ├── EvaluationLoader.js  # 4-agent live evaluation display
│   │   ├── ScoreBadge.js        # Score display component
│   │   └── Toast.js             # Notification component
│   ├── context/
│   │   └── WalletContext.js     # MetaMask connection + account switching
│   └── lib/
│       ├── api.js               # All backend fetch helpers
│       └── abis/                # Contract ABI JSON files
│
├── config/
│   └── addresses.json           # Deployed contract addresses (auto-generated)
│
├── challenges.json              # 20+ prompt engineering challenges (off-chain)
├── index.js                     # Express entry point
├── hardhat.config.js            # Hardhat + Monad network config
└── .env                         # Environment variables (never commit)
```

---

## Deployed Contracts

**Network:** Monad Testnet (Chain ID: `10143`)  
**RPC:** `https://testnet-rpc.monad.xyz`  
**Explorer:** `https://testnet.monadexplorer.com`

| Contract | Address |
|---|---|
| `TrainingRegistry` | [`0x45de6d556Cebd0a8f3275c90cd450e27f03084a2`](https://testnet.monadexplorer.com/address/0x45de6d556Cebd0a8f3275c90cd450e27f03084a2) |
| `PromptNFT` | [`0xef02dD9AE8C02a9C2972A78cE0b04cf62BAcC3b4`](https://testnet.monadexplorer.com/address/0xef02dD9AE8C02a9C2972A78cE0b04cf62BAcC3b4) |

**Seeded demo listings:** 8 prompts across Technical Writing, Code Review, SQL, Testing, AI Agent Design, Summarization, Debugging, and Prompt Engineering categories — all minted on-chain with live IPFS metadata.

---

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | ≥ 20 | Required |
| MongoDB | ≥ 6 | Run locally or use Atlas |
| MetaMask | Latest | For frontend wallet interaction |
| MON tokens | Any amount | Get from [Monad testnet faucet](https://faucet.monad.xyz) |

---

## Environment Setup

Create a `.env` file in the project root:

```env
# ── AI (Google Gemini — free tier) ───────────────────────────────────
GEMINI_API_KEY=your_key_here
# Get key at: https://aistudio.google.com/app/apikey

# ── IPFS (Pinata) ─────────────────────────────────────────────────────
PINATA_API_KEY=your_key_here
PINATA_SECRET=your_secret_here
PINATA_JWT=your_jwt_token_here
# Get at: https://app.pinata.cloud → API Keys → New Key (admin scopes required)

# ── Blockchain (Monad Testnet) ────────────────────────────────────────
PRIVATE_KEY=your_deployer_wallet_private_key_no_0x_prefix
MONAD_RPC_URL=https://testnet-rpc.monad.xyz

# ── Database ──────────────────────────────────────────────────────────
MONGODB_URI=mongodb://localhost:27017/promptfi

# ── Server ────────────────────────────────────────────────────────────
PORT=5000
```

Frontend environment (`frontend/.env.local`):

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
NEXT_PUBLIC_PROMPT_NFT_ADDRESS=0xef02dD9AE8C02a9C2972A78cE0b04cf62BAcC3b4
NEXT_PUBLIC_TRAINING_REGISTRY_ADDRESS=0x45de6d556Cebd0a8f3275c90cd450e27f03084a2
NEXT_PUBLIC_MONAD_RPC=https://testnet-rpc.monad.xyz
NEXT_PUBLIC_CHAIN_ID=10143
```

---

## Running Locally

### 1. Install dependencies

```bash
# Backend
npm install

# Frontend
cd frontend && npm install && cd ..
```

### 2. Run preflight checks

```bash
npm run preflight
```

Verifies all env vars, MongoDB connection, Pinata auth, and Gemini API.

### 3. Compile and deploy contracts (skip if using deployed addresses above)

```bash
npm run compile
npm run deploy
```

### 4. Seed demo data

```bash
# Seed 8 marketplace prompts (IPFS + Monad + MongoDB)
npm run seed:marketplace
```

### 5. Start backend API

```bash
npm run dev
# → http://localhost:5000/api
```

### 6. Start frontend

```bash
cd frontend
npm run dev
# → http://localhost:3000
```

---

## Scripts Reference

| Command | Description |
|---|---|
| `npm run dev` | Start Express API server (port 5000) |
| `npm run compile` | Compile Solidity contracts via Hardhat |
| `npm run deploy` | Deploy contracts to Monad testnet |
| `npm run preflight` | Check all env vars + service connectivity |
| `npm run seed:marketplace` | Seed 8 demo prompts (IPFS + mint + embeddings) |
| `npm run seed:challenges` | Re-generate challenges.json |
| `npm run set:expert <wallet>` | Force Expert status on any wallet (dev/demo) |
| `npm test` | Run Hardhat contract tests |

### Dev Tool: Force Expert Status

For demo purposes, grant Expert status to any wallet without completing training:

```bash
npm run set:expert 0xYourWalletAddress
```

This calls `logChallengeAttempt` as the contract owner with enough score-100 attempts to push the on-chain average above 75, then triggers `checkAndSetExpert`. All transactions are confirmed on-chain and visible on MonadScan.

---

## API Reference

All routes prefixed with `/api`. Backend runs on port `5000`.

### `GET /api` — Health check

```json
{ "status": "PromptFi API running", "version": "1.0.0" }
```

---

### Training

#### `POST /api/training/submit` — Submit a challenge attempt

```json
// Request
{
  "walletAddress": "0x...",
  "challengeId": 1,
  "promptText": "Your prompt text here..."
}

// Response
{
  "success": true,
  "evaluation": {
    "clarityScore": 82,       "clarityFeedback": ["..."],
    "structureScore": 78,     "structureFeedback": ["..."],
    "originalityScore": 91,   "originalityFeedback": ["..."],
    "isPlagiarism": false,
    "outputQualityScore": 85, "outputQualityFeedback": ["..."],
    "generatedOutput": "...",
    "overallScore": 84
  },
  "isExpert": false,
  "walletAddress": "0x...",
  "txHash": "0x...",
  "monadScanUrl": "https://testnet.monadexplorer.com/tx/0x..."
}
```

#### `GET /api/training/challenges` — All active challenges

```json
{
  "success": true,
  "challenges": [
    { "challengeId": 1, "category": "Code Generation", "difficulty": "Intermediate", "problemStatement": "..." }
  ],
  "total": 20
}
```

#### `GET /api/training/progress/:wallet` — Wallet training progress

```json
{
  "success": true,
  "wallet": "0x...",
  "averageScore": 77,
  "isExpert": true,
  "attemptCount": 14,
  "progressToExpert": 100
}
```

---

### Minting

#### `POST /api/mint` — Evaluate + mint a prompt as NFT (Expert only)

```json
// Request
{
  "walletAddress": "0x...",
  "promptText": "Full prompt text...",
  "problemStatement": "What this prompt solves",
  "category": "Code Generation",
  "price": "0.05"
}

// Response (success)
{
  "success": true,
  "tokenId": 8,
  "ipfsHash": "QmXxx...",
  "evaluation": { ... },
  "monadScanUrl": "https://testnet.monadexplorer.com/tx/0x..."
}

// Response (score too low)
{
  "success": false,
  "error": "Score 62/100 is below the minimum 70 required to mint.",
  "evaluation": { ... }
}
```

---

### Marketplace

#### `GET /api/marketplace` — All listed prompts

```json
{
  "success": true,
  "listings": [
    {
      "tokenId": 0,
      "ipfsHash": "QmdfD6L...",
      "problemStatement": "Generate complete REST API documentation...",
      "clarityScore": 92,
      "structureScore": 96,
      "originalityScore": 78,
      "outputQualityScore": 94,
      "overallScore": 90,
      "creatorWallet": "0x1796...",
      "price": "25000000000000000",
      "isListed": true
    }
  ]
}
```

#### `POST /api/buyer/find` — Semantic search

```json
// Request
{ "query": "help me write SQL from plain English", "budget": 0.05 }

// Response
{
  "success": true,
  "matches": [
    { "tokenId": 2, "problemStatement": "...", "overallScore": 90, "similarity": 0.923, "rankScore": 0.914 }
  ]
}
```

---

### Account

#### `GET /api/account/:wallet` — Full wallet profile

```json
{
  "success": true,
  "wallet": "0x...",
  "training": { "averageScore": 77, "isExpert": true, "attemptCount": 14 },
  "stats": { "minted": 1, "purchased": 2, "owned": 3 },
  "minted": [ { "tokenId": 8, ... } ],
  "purchased": [ { "tokenId": 0, ... }, { "tokenId": 3, ... } ],
  "allOwned": [ ... ]
}
```

---

## Frontend Pages

| Route | Description |
|---|---|
| `/` | Landing page — value proposition, stats, CTA |
| `/marketplace` | Browse all listed prompts, AI semantic search, buy with MetaMask |
| `/training` | 20+ challenges, live 4-agent evaluation, progress tracker |
| `/mint` | Expert-only prompt minting with live scoring |
| `/account` | Wallet profile — minted/purchased/owned NFTs, training history, MonadScan links |

### Wallet Integration

- **Connect:** `wallet_requestPermissions` — always opens MetaMask account picker
- **Auto-reconnect:** `eth_accounts` on page load (silent, no popup)
- **Account switching:** `accountsChanged` event listener
- **Network switching:** Auto-adds Monad Testnet if not present
- **Buy flow:** Inline status (pending → confirming → done) with live MonadScan links — no browser alerts

---

## User Flow

```
New User
    │
    ├── 1. Connect MetaMask → auto-switches to Monad Testnet
    │
    ├── 2. TRAIN
    │       ├── Pick challenge from 20+ categories
    │       ├── Write a prompt
    │       ├── 4 AI agents evaluate in parallel (~10-20s)
    │       ├── Score logged on TrainingRegistry (Monad tx)
    │       └── Average ≥ 75 → ★ Expert status granted on-chain
    │
    ├── 3. MINT (Expert only)
    │       ├── Write prompt + set price
    │       ├── 4 AI agents re-evaluate
    │       ├── Score ≥ 70 → metadata pinned to IPFS
    │       ├── PromptNFT minted on Monad
    │       └── Embedding stored in MongoDB for search
    │
    └── 4. SELL
            ├── NFT auto-listed at your price
            ├── Buyers find via semantic search
            └── Purchase: ERC-721 transfer + MON payment → your wallet
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Blockchain** | Monad Testnet (EVM-compatible, ERC-721) |
| **Smart Contracts** | Solidity 0.8.20, OpenZeppelin v5, Hardhat |
| **AI Evaluation** | Google Gemini 2.0 Flash (free tier) |
| **Embeddings** | Xenova/all-MiniLM-L6-v2 (local, no API cost) |
| **Vector Store** | MongoDB + cosine similarity |
| **IPFS** | Pinata (JWT auth, native HTTPS pinning) |
| **Backend** | Node.js, Express.js, ethers.js v6 |
| **Frontend** | Next.js 14, Tailwind CSS |
| **Wallet** | MetaMask (`wallet_requestPermissions`) |

---

## License

MIT