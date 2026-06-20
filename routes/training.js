/**
 * Training routes:
 *   POST /api/training/submit         Submit training challenge attempt
 *   GET  /api/training/challenges     All active challenges (from challenges.json — no chain)
 *   GET  /api/training/progress/:wallet  Wallet training progress from TrainingRegistry
 */

const express = require('express');
const router = express.Router();

const { evaluateClarity } = require('../agents/clarityAgent');
const { evaluateStructure } = require('../agents/structureAgent');
const { evaluateOriginality } = require('../agents/originalityAgent');
const { evaluateOutputQuality } = require('../agents/outputQualityAgent');
const { aggregate } = require('../agents/aggregator');
const { getTrainingRegistry } = require('../services/contractService');

// Load challenges from flat JSON — no ChallengeRegistry contract needed
const ALL_CHALLENGES = require('../challenges.json');

/**
 * POST /api/training/submit
 * Submit a training challenge attempt for evaluation.
 * Body: { walletAddress, challengeId, promptText }
 */
router.post('/submit', async (req, res) => {
  try {
    const { walletAddress, challengeId, promptText } = req.body;

    if (!walletAddress || challengeId === undefined || !promptText) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: walletAddress, challengeId, promptText',
      });
    }

    // Validate challenge exists
    const challenge = ALL_CHALLENGES.find((c) => c.challengeId === Number(challengeId));
    if (!challenge) {
      return res.status(404).json({ success: false, error: `Challenge ${challengeId} not found` });
    }

    // Run all 4 evaluation agents in parallel
    const [clarity, structure, originality, outputQuality] = await Promise.all([
      evaluateClarity(promptText),
      evaluateStructure(promptText),
      evaluateOriginality(promptText),
      evaluateOutputQuality(promptText),
    ]);

    const evaluation = aggregate(clarity, structure, originality, outputQuality);

    // Log the challenge attempt on-chain → TrainingRegistry
    const contract = getTrainingRegistry();
    const logTx = await contract.logChallengeAttempt(
      walletAddress,
      challengeId,
      evaluation.overallScore
    );
    const logReceipt = await logTx.wait();
    const txHash = logReceipt.hash;

    // Auto-set expert status on-chain if avg >= 75
    const expertTx = await contract.checkAndSetExpert(walletAddress);
    await expertTx.wait();

    const isExpert = await contract.isExpertWallet(walletAddress);

    return res.json({
      success: true,
      evaluation,
      isExpert,
      walletAddress,
      txHash,
      monadScanUrl: `https://testnet.monadexplorer.com/tx/${txHash}`,
    });
  } catch (error) {
    console.error('[Training] Submit error:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/training/challenges
 * Returns all active challenges directly from challenges.json.
 * No contract call — ChallengeRegistry has been removed from the architecture.
 */
router.get('/challenges', (req, res) => {
  try {
    const active = ALL_CHALLENGES.filter((c) => c.isActive);
    return res.json({
      success: true,
      challenges: active,
      total: active.length,
    });
  } catch (error) {
    console.error('[Training] Challenges error:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/training/progress/:wallet
 * Returns training progress for a specific wallet from TrainingRegistry (on-chain).
 */
router.get('/progress/:wallet', async (req, res) => {
  try {
    const { wallet } = req.params;

    if (!wallet || !/^0x[0-9a-fA-F]{40}$/.test(wallet)) {
      return res.status(400).json({ success: false, error: 'Invalid wallet address' });
    }

    const trainingRegistry = getTrainingRegistry();

    const [averageScoreBig, isExpert, attemptCountBig] = await Promise.all([
      trainingRegistry.getAverageScore(wallet),
      trainingRegistry.isExpertWallet(wallet),
      trainingRegistry.getAttemptCount(wallet),
    ]);

    const averageScore = Number(averageScoreBig);
    const attemptCount = Number(attemptCountBig);

    return res.json({
      success: true,
      wallet,
      averageScore,
      isExpert,
      attemptCount,
      progressToExpert: Math.min((averageScore / 75) * 100, 100),
    });
  } catch (error) {
    console.error('[Training] Progress error:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
