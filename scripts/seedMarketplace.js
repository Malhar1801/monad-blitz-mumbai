/**
 * seedMarketplace.js
 *
 * Seeds the PromptFi marketplace with 8 demo prompt NFTs.
 * Each prompt is:
 *   1. Uploaded to IPFS via Pinata  →  get ipfsHash
 *   2. Minted on Monad              →  PromptNFT.mintPrompt(creator, ipfsHash, scores, price)
 *   3. Stored in MongoDB            →  PromptEmbedding (for semantic search)
 *
 * Run AFTER deploying contracts:
 *   node scripts/seedMarketplace.js
 *
 * Requirements: .env configured with PRIVATE_KEY, MONAD_RPC_URL,
 *               PINATA_API_KEY, PINATA_SECRET, MONGODB_URI, GEMINI_API_KEY
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { ethers } = require('ethers');
const { uploadMetadata } = require('../services/ipfsService');
const { getEmbedding } = require('../services/embeddingService');
const PromptEmbedding = require('../models/PromptEmbedding');

// ── Contract setup ─────────────────────────────────────────────────────────────
const provider = new ethers.JsonRpcProvider(process.env.MONAD_RPC_URL);
const signer   = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const addresses = require('../config/addresses.json');
const PromptNFTArtifact = require('../artifacts/contracts/PromptNFT.sol/PromptNFT.json');
const promptNFT = new ethers.Contract(addresses.promptNFT, PromptNFTArtifact.abi, signer);

// ── Demo creator wallet (the deployer for seed data) ──────────────────────────
const DEMO_CREATOR = signer.address;

// ── Prompt data loaded from JSON (avoids template-literal / backtick conflicts) ─
const DEMO_PROMPTS = require('./demoPrompts.json');

// ─────────────────────────────────────────────────────────────────────────────
// SEED FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

async function seedPrompt(promptData, index) {
  const { problemStatement, category, price, scores, generatedOutput, promptText } = promptData;
  const label = `[${index + 1}/${DEMO_PROMPTS.length}] ${category}`;

  console.log(`\n${label} — uploading to IPFS...`);

  // ── 1. Build IPFS metadata (matches canonical schema) ─────────────────────
  const ipfsMetadata = {
    promptText,
    problemStatement,
    category,
    scores: {
      clarity:      scores.clarity,
      structure:    scores.structure,
      originality:  scores.originality,
      outputQuality: scores.outputQuality,
      overall: Math.round(
        (scores.clarity + scores.structure + scores.originality + scores.outputQuality) / 4
      ),
    },
    generatedOutput,
    createdAt: new Date().toISOString(),
  };

  const overallScore = ipfsMetadata.scores.overall;

  // ── 2. Upload to IPFS ──────────────────────────────────────────────────────
  let ipfsHash;
  try {
    ipfsHash = await uploadMetadata(ipfsMetadata);
    console.log(`  ✓ IPFS: ${ipfsHash}`);
  } catch (err) {
    console.error(`  ✗ IPFS upload failed: ${err.message}`);
    throw err;
  }

  // ── 3. Mint on-chain ───────────────────────────────────────────────────────
  console.log(`  Minting on Monad...`);
  const priceWei = ethers.parseEther(price);
  try {
    const tx = await promptNFT.mintPrompt(
      DEMO_CREATOR,
      ipfsHash,
      [scores.clarity, scores.structure, scores.originality, scores.outputQuality],
      priceWei
    );
    const receipt = await tx.wait();
    console.log(`  ✓ Minted — tx: ${receipt.hash}`);

    // Extract tokenId from PromptMinted event
    let tokenId = null;
    for (const log of receipt.logs) {
      try {
        const parsed = promptNFT.interface.parseLog(log);
        if (parsed && parsed.name === 'PromptMinted') {
          tokenId = parsed.args.tokenId.toString();
          break;
        }
      } catch (_) { /* not our event */ }
    }
    console.log(`  ✓ Token ID: ${tokenId}`);

    // ── 4. Store embedding in MongoDB ──────────────────────────────────────
    console.log(`  Generating embedding...`);
    const embedding = await getEmbedding(promptText);
    if (embedding) {
      await PromptEmbedding.create({
        tokenId,
        promptText,
        problemStatement,
        embedding,
        overallScore,
        isListed: true,
      });
      console.log(`  ✓ MongoDB embedding stored`);
    } else {
      console.warn(`  ⚠ Embedding failed — prompt will not appear in semantic search`);
    }

    return { tokenId, ipfsHash, overallScore };
  } catch (err) {
    console.error(`  ✗ Mint failed: ${err.message}`);
    throw err;
  }
}

async function main() {
  console.log('════════════════════════════════════════════════════');
  console.log('  PromptFi — Marketplace Seed Script');
  console.log('════════════════════════════════════════════════════');
  console.log(`Deployer / demo creator: ${DEMO_CREATOR}`);
  console.log(`PromptNFT address:       ${addresses.promptNFT}`);
  console.log(`Seeding ${DEMO_PROMPTS.length} demo prompts...\n`);

  // ── Connect MongoDB ──────────────────────────────────────────────────────
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/promptfi');
  console.log('✓ MongoDB connected\n');

  const results = [];
  const errors  = [];

  for (let i = 0; i < DEMO_PROMPTS.length; i++) {
    try {
      const result = await seedPrompt(DEMO_PROMPTS[i], i);
      results.push({ ...result, category: DEMO_PROMPTS[i].category });
    } catch (err) {
      errors.push({ index: i, category: DEMO_PROMPTS[i].category, error: err.message });
      console.error(`  Skipping prompt ${i + 1} due to error above.`);
    }
  }

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log('\n════════════════════════════════════════════════════');
  console.log('  SEED COMPLETE');
  console.log('════════════════════════════════════════════════════');
  console.log(`  ✓ Minted:  ${results.length}`);
  console.log(`  ✗ Failed:  ${errors.length}`);

  if (results.length > 0) {
    console.log('\n  Minted tokens:');
    results.forEach(r => {
      console.log(`    #${r.tokenId}  [${r.category}]  score: ${r.overallScore}  ipfs: ${r.ipfsHash}`);
    });
  }

  if (errors.length > 0) {
    console.log('\n  Errors:');
    errors.forEach(e => console.log(`    Prompt ${e.index + 1} [${e.category}]: ${e.error}`));
  }

  await mongoose.disconnect();
  console.log('\n✓ Done. Run `npm run dev` to start the backend and see listings.');
}

main().catch((err) => {
  console.error('\n[FATAL]', err.message);
  process.exit(1);
});
