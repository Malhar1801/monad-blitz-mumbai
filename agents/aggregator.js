/**
 * Aggregator — Pure math, no LLM call.
 * Combines all 4 agent results into a unified evaluation object.
 * overallScore = weighted average of all 4 scores (0.25 each)
 */

/**
 * Aggregate all 4 agent evaluation results.
 * @param {Object} clarityResult       - { score, feedback }
 * @param {Object} structureResult     - { score, feedback }
 * @param {Object} originalityResult   - { score, feedback, isPlagiarism }
 * @param {Object} outputQualityResult - { score, feedback, generatedOutput }
 * @returns {Object} Full evaluation object with overallScore
 */
function aggregate(clarityResult, structureResult, originalityResult, outputQualityResult) {
  const overallScore = Math.round(
    (clarityResult.score * 0.25) +
    (structureResult.score * 0.25) +
    (originalityResult.score * 0.25) +
    (outputQualityResult.score * 0.25)
  );

  return {
    clarityScore: clarityResult.score,
    clarityFeedback: clarityResult.feedback,
    structureScore: structureResult.score,
    structureFeedback: structureResult.feedback,
    originalityScore: originalityResult.score,
    originalityFeedback: originalityResult.feedback,
    isPlagiarism: originalityResult.isPlagiarism || false,
    outputQualityScore: outputQualityResult.score,
    outputQualityFeedback: outputQualityResult.feedback,
    generatedOutput: outputQualityResult.generatedOutput || '',
    overallScore,
  };
}

module.exports = { aggregate };
