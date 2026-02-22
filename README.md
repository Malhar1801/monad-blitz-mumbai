# PromptFi — Decentralized AI Prompt Marketplace on Monad

> Trade, own, and monetize AI prompts as NFTs — permanently on-chain.

---

## What is PromptFi?

PromptFi is a decentralized marketplace where anyone can mint, buy, and sell AI prompts as NFTs on the Monad blockchain. Each prompt is stored on IPFS via Pinata and minted as a unique token on-chain — giving creators true ownership and buyers permanent, verifiable access.

The prompt content remains encrypted until purchase. Once a buyer acquires the NFT, they can reveal the full prompt directly from IPFS. Buyers can also rate prompts on-chain, building a transparent reputation layer for creators.

---

## The Problem

AI prompts are intellectual property — but today they are shared freely, copied without credit, and monetized by platforms rather than their creators. There is no trustless way to sell a prompt, verify ownership, or guarantee access after purchase.

---

## The Solution

PromptFi puts prompts on-chain:

- **Creators** mint their prompt as an NFT with a set price and category
- **Buyers** purchase the NFT and unlock the full prompt content
- **Ownership** is recorded on Monad — permanent, transferable, verifiable
- **Ratings** are submitted on-chain, creating an honest reputation system
- **Storage** is decentralized via IPFS — no central server can take your prompt down

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Blockchain | Monad Testnet |
| Smart Contract | Solidity |
| Contract Dev | Hardhat |
| Frontend | Next.js + React |
| Wallet | MetaMask (ethers.js) |
| Decentralized Storage | IPFS via Pinata |
| Styling | Custom CSS (no UI library) |

---

## Core Features

- **Mint Prompt NFTs** — upload title, category, and prompt content; stored on IPFS, minted on Monad
- **Marketplace** — browse all active listings filtered by category (ChatGPT, Coding, Design, Marketing, Other)
- **Buy and Unlock** — purchase a prompt NFT and reveal the full content on-chain
- **My Prompts** — view prompts you've created and prompts you've purchased
- **On-chain Ratings** — rate purchased prompts (1–5), averaged and stored on-chain
- **Wallet Connect** — MetaMask integration with live connection status

---

## Smart Contract

Deployed on **Monad Testnet**

```
Contract Address: 0x82c98CfEcF70F16a71515BE6322056F1E5aBB189
```

### Key Functions

```solidity
createPrompt(string ipfsHash, uint256 price, string category)
buyPrompt(uint256 tokenId)
getPromptDetails(uint256 tokenId)
getAllPrompts()
ratePrompt(uint256 tokenId, uint8 rating)
```

---

## Project Structure

```
promptfi/
├── contracts/
│   └── PromptFi.sol          # Main NFT marketplace contract
├── scripts/
│   └── deploy.js             # Hardhat deployment script
├── pages/
│   ├── index.jsx             # Marketplace page
│   ├── create.jsx            # Mint a new prompt NFT
│   └── my-prompts.jsx        # User's created and purchased prompts
├── components/
│   └── navbar.jsx            # Navigation with wallet connect
├── utils/
│   └── contract.js           # Contract ABI and address
└── hardhat.config.js
```

---

## Running Locally

### Prerequisites
- Node.js v18+
- MetaMask browser extension
- Monad Testnet configured in MetaMask

### Install and Run

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/promptfi.git
cd promptfi

# Install dependencies
npm install

# Add environment variables
cp .env.example .env.local
# Fill in your values (see below)

# Run the development server
npm run dev
```

### Environment Variables

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x82c98CfEcF70F16a71515BE6322056F1E5aBB189
NEXT_PUBLIC_PINATA_API_KEY=your_pinata_api_key
NEXT_PUBLIC_PINATA_SECRET=your_pinata_secret
```

### Deploy Contract (optional)

```bash
npx hardhat run scripts/deploy.js --network monad_testnet
```

---

## Monad Testnet Configuration

Add Monad Testnet to MetaMask:

| Field | Value |
|-------|-------|
| Network Name | Monad Testnet |
| RPC URL | `https://testnet-rpc.monad.xyz` |
| Chain ID | `10143` |
| Currency Symbol | MON |
| Explorer | `https://testnet.monadexplorer.com` |

---

## Team

Built at **Monad Blitz Mumbai** hackathon.

---

## License

MIT
