/**
 * filterAgent.js
 *
 * Semantic marketplace search using local embeddings + cosine similarity.
 * Ranks prompts by: (similarity × 0.6) + (overallScore/100 × 0.4)
 * Returns top 3 matches.
 */

const { getEmbedding }     = require('../services/embeddingService');
const PromptEmbedding      = require('../models/PromptEmbedding');
const { cosineSimilarity } = require('./utils');

/**
 * @param {string} query   Natural language description of what the buyer needs
 * @param {number} [budget] Optional budget in MON (not currently filtered — stored for future use)
 * @returns {Promise<Array>} Top 3 ranked matches
 */
async function findMatchingPrompts(query, budget) {
  try {
    // ── 1. Embed the buyer's query locally ────────────────────────────────────
    const queryEmbedding = await getEmbedding(query);
    if (!queryEmbedding) return [];

    // ── 2. Fetch all listed prompt embeddings from MongoDB ────────────────────
    const docs = await PromptEmbedding.find({ isListed: true }).lean();
    if (docs.length === 0) return [];

    // ── 3. Score every listing ────────────────────────────────────────────────
    const scored = docs
      .filter(doc => doc.embedding?.length === queryEmbedding.length)
      .map(doc => {
        const similarity = cosineSimilarity(queryEmbedding, doc.embedding);
        const rankScore  = (similarity * 0.6) + ((doc.overallScore / 100) * 0.4);
        return {
          tokenId:          doc.tokenId,
          problemStatement: doc.problemStatement,
          overallScore:     doc.overallScore,
          similarity:       Math.round(similarity * 1000) / 1000,
          rankScore:        Math.round(rankScore  * 1000) / 1000,
        };
      });

    // ── 4. Sort descending by rank score, return top 3 ────────────────────────
    scored.sort((a, b) => b.rankScore - a.rankScore);
    return scored.slice(0, 3);
  } catch (err) {
    console.error('[FilterAgent] Error:', err.message);
    return [];
  }
}

module.exports = { findMatchingPrompts };
