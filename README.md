# PromptFi

A prompt engineering marketplace on **Monad testnet** (EVM-compatible). Creators train to earn Expert status, then mint evaluated prompts as NFTs. Buyers search semantically and purchase directly on-chain.

---

## Project Structure

```
/contracts          → Solidity contracts (ERC-721 + registries)
/scripts            → Hardhat deploy + seed scripts
/agents             → AI evaluation agents + filter agent
/routes             → Express API routes
/services           → ethers.js, Pinata IPFS, OpenAI embedding helpers
/models             → Mongoose models (PromptEmbedding)
/config             → addresses.json (written by deploy script)
index.js            → Express entry point
```

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in all values:

```bash
cp .env.example .env
```

```env
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
PINATA_API_KEY=...
PINATA_SECRET=...
PRIVATE_KEY=<deployer wallet private key, no 0x prefix>
MONAD_RPC_URL=https://testnet-rpc.monad.xyz
MONGODB_URI=mongodb://localhost:27017/promptfi
PORT=3000
```

### 3. Compile contracts

```bash
npx hardhat compile
```

### 4. Deploy to Monad testnet

```bash
npx hardhat run scripts/deploy.js --network monad
```

Addresses are written to `config/addresses.json`.

### 5. Seed challenges (optional)

```bash
npx hardhat run scripts/seedChallenges.js --network monad
```

### 6. Start the API server

```bash
npm run dev
```

---

## API Reference

### Health Check

```
GET /
```

---

### Training

#### Submit a challenge attempt (Trainee)

```
POST /training/submit
Content-Type: application/json

{
  "walletAddress": "0x...",
  "challengeId": 0,
  "promptText": "Your prompt here..."
}
```

**Response:**
```json
{
  "success": true,
  "evaluation": {
    "clarityScore": 82,
    "clarityFeedback": ["..."],
    "structureScore": 78,
    "structureFeedback": ["..."],
    "originalityScore": 91,
    "originalityFeedback": ["..."],
    "isPlagiarism": false,
    "outputQualityScore": 85,
    "outputQualityFeedback": ["..."],
    "generatedOutput": "...",
    "overallScore": 84
  },
  "isExpert": false,
  "walletAddress": "0x..."
}
```

When `isExpert` flips to `true`, the wallet is eligible to mint.

---

### Minting

#### Mint a prompt as NFT (Expert only)

```
POST /mint
Content-Type: application/json

{
  "walletAddress": "0x...",
  "promptText": "Your prompt here...",
  "problemStatement": "What this prompt solves...",
  "category": "Code Generation",
  "price": "0.05"
}
```

**Response (success):**
```json
{
  "success": true,
  "tokenId": 0,
  "ipfsHash": "QmXxx...",
  "evaluation": { ... }
}
```

**Response (score < 70):**
```json
{
  "success": false,
  "error": "Prompt quality score too low for minting. Minimum required: 70.",
  "evaluation": { ... }
}
```

---

### Marketplace

#### Get all listed prompts

```
GET /marketplace
```

**Response:**
```json
{
  "success": true,
  "listings": [
    {
      "tokenId": 0,
      "ipfsHash": "QmXxx...",
      "clarityScore": 82,
      "structureScore": 78,
      "originalityScore": 91,
      "outputScore": 85,
      "overallScore": 84,
      "isVerified": false,
      "creatorWallet": "0x...",
      "price": "50000000000000000",
      "isListed": true
    }
  ]
}
```

---

### Buyer

#### Find matching prompts (semantic search)

```
POST /buyer/find
Content-Type: application/json

{
  "query": "I need a prompt that helps write SQL queries from plain English",
  "budget": 0.1
}
```

**Response:**
```json
{
  "success": true,
  "query": "...",
  "matches": [
    {
      "tokenId": 3,
      "problemStatement": "Convert natural language to SQL...",
      "overallScore": 87,
      "similarity": 0.923,
      "rankScore": 0.902
    }
  ],
  "totalFound": 3
}
```

#### Purchase (frontend only)

Buyers call `PromptNFT.buyPrompt(tokenId)` directly from their MetaMask wallet with `msg.value = price`. No backend route needed.

```js
// Frontend (ethers.js v6)
const contract = new ethers.Contract(PROMPT_NFT_ADDRESS, ABI, signer);
const tx = await contract.buyPrompt(tokenId, { value: price });
await tx.wait();
```

---

## Smart Contracts

| Contract | Purpose |
|---|---|
| `TrainingRegistry` | Tracks challenge attempts per wallet, auto-grants Expert status at avg ≥ 75 |
| `ChallengeRegistry` | On-chain challenge store (owner-managed) |
| `PromptNFT` | ERC-721 marketplace with scoring metadata, buy/sell in MON |

---

## Agent Architecture

All 4 evaluation agents run in `Promise.all()` — total latency = slowest agent, not sum.

| Agent | Method | Returns |
|---|---|---|
| Clarity | 1× Claude call | `{ score, feedback[] }` |
| Structure | 1× Claude call | `{ score, feedback[] }` |
| Originality | OpenAI embed + cosine sim + 1× Claude (feedback only) | `{ score, feedback[], isPlagiarism }` |
| Output Quality | 2× Claude calls (generate → judge) | `{ score, feedback[], generatedOutput }` |
| Aggregator | Pure math (weighted avg) | Full evaluation object |
| Filter Agent | OpenAI embed + cosine sim ranking | Top 3 matches |
