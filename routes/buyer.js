/**
 * POST /buyer/find
 * Takes a natural language query and returns the top 3 matching prompts
 * ranked by semantic similarity × quality score.
 *
 * Note: /buyer/purchase is intentionally omitted — the buyer's frontend wallet
 * (MetaMask) calls PromptNFT.buyPrompt() directly on-chain.
 */

const express = require('express');
const router = express.Router();

const { findMatchingPrompts } = require('../agents/filterAgent');

/**
 * POST /buyer/find
 * Body: { query: string, budget?: number }
 * Returns top 3 matching listed prompts.
 */
router.post('/find', async (req, res) => {
  try {
    const { query, budget } = req.body;

    if (!query || typeof query !== 'string' || query.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Missing or empty required field: query',
      });
    }

    const matches = await findMatchingPrompts(query.trim(), budget);

    return res.json({
      success: true,
      query: query.trim(),
      matches,
      totalFound: matches.length,
    });
  } catch (error) {
    console.error('[Buyer/Find] Error:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
