/**
 * GET /api/account/:wallet
 *
 * Returns complete account profile for a wallet:
 *   - Training progress + attempt history
 *   - Minted prompts (creatorWallet === wallet)
 *   - Purchased prompts (ownerOf === wallet AND creatorWallet !== wallet)
 *   - Owned prompts (all tokens currently owned)
 */

const express = require('express');
const router  = express.Router();
const { getPromptNFT, getTrainingRegistry } = require('../services/contractService');
const PromptEmbedding = require('../models/PromptEmbedding');

const sleep    = (ms) => new Promise((r) => setTimeout(r, ms));

async function withRetry(fn, retries = 3, delayMs = 300) {
  for (let i = 0; i <= retries; i++) {
    try { return await fn(); }
    catch (err) {
      if (i === retries) throw err;
      await sleep(delayMs * (i + 1));
    }
  }
}

router.get('/:wallet', async (req, res) => {
  try {
    const { wallet } = req.params;
    if (!wallet || !/^0x[0-9a-fA-F]{40}$/.test(wallet)) {
      return res.status(400).json({ success: false, error: 'Invalid wallet address' });
    }
    const walletLower = wallet.toLowerCase();

    const promptNFT        = getPromptNFT();
    const trainingRegistry = getTrainingRegistry();

    // ── 1. Training progress ────────────────────────────────────────────────
    const [avgScoreBig, isExpert, attemptCountBig] = await Promise.all([
      withRetry(() => trainingRegistry.getAverageScore(wallet)),
      withRetry(() => trainingRegistry.isExpertWallet(wallet)),
      withRetry(() => trainingRegistry.getAttemptCount(wallet)),
    ]);
    const averageScore  = Number(avgScoreBig);
    const attemptCount  = Number(attemptCountBig);

    // ── 2. Scan all tokens serially for ownership ───────────────────────────
    let tokenCount = 0;
    try {
      tokenCount = Number(await withRetry(() => promptNFT.tokenCount()));
    } catch (_) {}

    const minted    = [];   // created by this wallet
    const purchased = [];   // owned but not created
    const allOwned  = [];   // everything currently owned

    const tokenIds = Array.from({ length: tokenCount }, (_, i) => i);

    // Fetch all mongo enrichment data up front
    const mongoDocs = await PromptEmbedding.find(
      { tokenId: { $in: [...tokenIds, ...tokenIds.map(String)] } },
      { tokenId: 1, problemStatement: 1, _id: 0 }
    ).lean();
    const mongoMap = {};
    for (const d of mongoDocs) mongoMap[String(d.tokenId)] = d;

    for (const id of tokenIds) {
      try {
        const [meta, owner] = await Promise.all([
          withRetry(() => promptNFT.getPromptMetadata(id)),
          withRetry(() => promptNFT.ownerOf(id)),
        ]);
        await sleep(60);

        const entry = {
          tokenId:           id,
          ipfsHash:          meta.ipfsHash,
          clarityScore:      Number(meta.clarityScore),
          structureScore:    Number(meta.structureScore),
          originalityScore:  Number(meta.originalityScore),
          outputQualityScore: Number(meta.outputScore),
          overallScore:      Number(meta.overallScore),
          isVerified:        meta.isVerified,
          creatorWallet:     meta.creatorWallet,
          currentOwner:      owner,
          price:             meta.price.toString(),
          isListed:          meta.isListed,
          problemStatement:  mongoMap[String(id)]?.problemStatement || `Prompt NFT #${id}`,
        };

        const isMinter = meta.creatorWallet.toLowerCase() === walletLower;
        const isOwner  = owner.toLowerCase() === walletLower;

        if (isOwner) allOwned.push(entry);
        if (isMinter) minted.push(entry);
        if (isOwner && !isMinter) purchased.push(entry);
      } catch (_) { /* skip token on error */ }
    }

    return res.json({
      success: true,
      wallet,
      training: {
        averageScore,
        isExpert,
        attemptCount,
        progressToExpert: Math.min((averageScore / 75) * 100, 100),
      },
      stats: {
        minted:    minted.length,
        purchased: purchased.length,
        owned:     allOwned.length,
      },
      minted,
      purchased,
      allOwned,
    });
  } catch (err) {
    console.error('[Account] Error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
