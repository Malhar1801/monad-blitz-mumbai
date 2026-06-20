/**
 * POST /api/mint
 * Evaluate a prompt with 4 AI agents, upload metadata to IPFS,
 * then mint the prompt as an NFT on Monad via PromptNFT.mintPrompt(creator, ...).
 *
 * Body: { walletAddress, promptText, problemStatement, category, price? }
 *
 * IPFS metadata schema (matches architecture spec):
 *   { promptText, problemStatement, category, scores, generatedOutput, createdAt }
 */

const express = require('express');
const { ethers } = require('ethers');
const router = express.Router();

const { evaluateClarity } = require('../agents/clarityAgent');
const { evaluateStructure } = require('../agents/structureAgent');
const { evaluateOriginality } = require('../agents/originalityAgent');
const { evaluateOutputQuality } = require('../agents/outputQualityAgent');
const { aggregate } = require('../agents/aggregator');
const { getTrainingRegistry, getPromptNFT } = require('../services/contractService');
const { uploadMetadata } = require('../services/ipfsService');
const { getEmbedding } = require('../services/embeddingService');
const PromptEmbedding = require('../models/PromptEmbedding');

router.post('/', async (req, res) => {
  try {
    const { walletAddress, promptText, problemStatement, category, price } = req.body;

    if (!walletAddress || !promptText || !problemStatement || !category) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: walletAddress, promptText, problemStatement, category',
      });
    }

    // ── 1. Expert gate ────────────────────────────────────────────────────────
    const trainingContract = getTrainingRegistry();
    const isExpert = await trainingContract.isExpertWallet(walletAddress);
    if (!isExpert) {
      return res.status(403).json({
        success: false,
        error: 'Only expert wallets can mint prompts. Complete training challenges to reach avg 75+.',
      });
    }

    // ── 2. Run 4 agents in parallel ───────────────────────────────────────────
    const [clarity, structure, originality, outputQuality] = await Promise.all([
      evaluateClarity(promptText),
      evaluateStructure(promptText),
      evaluateOriginality(promptText),
      evaluateOutputQuality(promptText),
    ]);

    const evaluation = aggregate(clarity, structure, originality, outputQuality);

    // ── 3. Score gate ─────────────────────────────────────────────────────────
    if (evaluation.overallScore < 70) {
      return res.status(400).json({
        success: false,
        error: `Prompt score ${evaluation.overallScore}/100 is below the 70-point mint threshold.`,
        evaluation,
      });
    }

    // ── 4. Build & upload IPFS metadata (canonical schema) ────────────────────
    const ipfsMetadata = {
      promptText,
      problemStatement,
      category,
      scores: {
        clarity: evaluation.clarityScore,
        structure: evaluation.structureScore,
        originality: evaluation.originalityScore,
        outputQuality: evaluation.outputQualityScore,
        overall: evaluation.overallScore,
      },
      generatedOutput: evaluation.generatedOutput || '',
      createdAt: new Date().toISOString(),
    };

    const ipfsHash = await uploadMetadata(ipfsMetadata);

    // ── 5. Mint on Monad ──────────────────────────────────────────────────────
    // PromptNFT.mintPrompt(address creator, string ipfsHash, uint256[4] scores, uint256 price)
    // Backend (owner) mints on behalf of the expert creator wallet.
    const priceInWei = ethers.parseEther(price || '0.01');
    const promptNFT = getPromptNFT();

    const mintTx = await promptNFT.mintPrompt(
      walletAddress,                    // creator — NFT is minted TO expert's wallet
      ipfsHash,
      [
        evaluation.clarityScore,
        evaluation.structureScore,
        evaluation.originalityScore,
        evaluation.outputQualityScore,
      ],
      priceInWei
    );
    const receipt = await mintTx.wait();

    // tokenId is returned by mintPrompt, parse from receipt logs or read tokenCount-1
    const tokenId = Number(await promptNFT.tokenCount()) - 1;

    // ── 6. Store embedding in MongoDB for marketplace search ──────────────────
    const embedding = await getEmbedding(promptText);
    if (embedding) {
      await PromptEmbedding.create({
        tokenId,
        promptText,
        problemStatement,
        embedding,
        overallScore: evaluation.overallScore,
        isListed: true,
      });
    }

    return res.json({
      success: true,
      tokenId,
      ipfsHash,
      evaluation,
      txHash: receipt.hash,
    });
  } catch (error) {
    console.error('[Mint] Error:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
