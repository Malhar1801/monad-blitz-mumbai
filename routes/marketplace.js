/**
 * GET /api/marketplace
 * Retrieves all currently listed prompts with retry + serial fetching
 * to avoid Monad testnet RPC rate limits.
 */

const express = require('express');
const router = express.Router();

const { getPromptNFT } = require('../services/contractService');
const PromptEmbedding = require('../models/PromptEmbedding');

// ── Helpers ────────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function withRetry(fn, retries = 3, delayMs = 400) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries) throw err;
      await sleep(delayMs * (i + 1)); // back-off: 400ms, 800ms, 1200ms
    }
  }
}

// ── Route ──────────────────────────────────────────────────────────────────────

router.get('/', async (req, res) => {
  try {
    const promptNFT = getPromptNFT();

    // 1. Get all listed token IDs (with retry)
    let listedTokenIds;
    try {
      listedTokenIds = await withRetry(() => promptNFT.getAllListedTokenIds());
    } catch (err) {
      console.error('[Marketplace] Error fetching listed IDs:', err.message);
      return res.status(500).json({ success: false, error: 'Failed to read contract: ' + err.message });
    }

    // 2. Fetch metadata SERIALLY with delay to avoid RPC rate limits
    const onChainData = [];
    for (const tokenId of listedTokenIds) {
      try {
        const meta = await withRetry(() => promptNFT.getPromptMetadata(tokenId));
        onChainData.push({
          tokenId: Number(tokenId),
          ipfsHash: meta.ipfsHash,
          clarityScore: Number(meta.clarityScore),
          structureScore: Number(meta.structureScore),
          originalityScore: Number(meta.originalityScore),
          outputQualityScore: Number(meta.outputScore),
          overallScore: Number(meta.overallScore),
          isVerified: meta.isVerified,
          creatorWallet: meta.creatorWallet,
          price: meta.price.toString(),
          isListed: meta.isListed,
        });
      } catch (err) {
        console.error(`[Marketplace] Skipping token ${tokenId} after retries:`, err.message);
      }
      await sleep(80); // 80ms between each call — well under most RPC limits
    }

    // 3. Enrich with off-chain data from MongoDB
    const tokenIds = onChainData.map((t) => t.tokenId);
    const mongoData = await PromptEmbedding.find(
      { tokenId: { $in: tokenIds.map(String) } },
      { tokenId: 1, problemStatement: 1, _id: 0 }
    ).lean();

    // Also try numeric tokenId match (belt-and-suspenders)
    const mongoDataNum = await PromptEmbedding.find(
      { tokenId: { $in: tokenIds } },
      { tokenId: 1, problemStatement: 1, _id: 0 }
    ).lean();

    const mongoMap = {};
    for (const doc of [...mongoData, ...mongoDataNum]) {
      mongoMap[String(doc.tokenId)] = doc;
    }

    // 4. Merge
    const listings = onChainData.map((token) => ({
      ...token,
      problemStatement: mongoMap[String(token.tokenId)]?.problemStatement || `Prompt NFT #${token.tokenId}`,
    }));

    return res.json({ success: true, listings });
  } catch (error) {
    console.error('[Marketplace] Error:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
