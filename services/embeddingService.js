/**
 * embeddingService.js
 *
 * Local sentence-transformer embeddings — zero API cost, runs entirely offline.
 * Uses @xenova/transformers with Xenova/all-MiniLM-L6-v2 (384 dimensions).
 *
 * The model (~22 MB) is downloaded once from HuggingFace on first call
 * and cached in node_modules/.cache/xenova (or HF_HOME if set).
 *
 * These embeddings are stored in MongoDB (PromptEmbedding collection)
 * and used for cosine-similarity search by the Originality + Filter agents.
 */

const path = require('path');

// Point cache to a predictable local folder inside the project
process.env.TRANSFORMERS_CACHE = path.join(__dirname, '..', '.model-cache');

let _pipeline = null;
let _loading  = false;
let _waiters  = [];

/**
 * Lazy-initialise the embedding pipeline (singleton).
 * Safe to call concurrently — subsequent calls wait for the first load.
 */
async function getPipeline() {
  if (_pipeline) return _pipeline;

  if (_loading) {
    // Another call is already downloading — queue up behind it
    return new Promise((resolve, reject) => _waiters.push({ resolve, reject }));
  }

  _loading = true;
  try {
    // Dynamic import required — @xenova/transformers is an ES module
    const { pipeline, env } = await import('@xenova/transformers');
    env.allowLocalModels  = false; // fetch from HF hub on first run
    env.useBrowserCache   = false;

    console.log('[Embedding] Loading Xenova/all-MiniLM-L6-v2 (first run downloads ~22 MB)...');
    _pipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log('[Embedding] Model ready.');

    _waiters.forEach(w => w.resolve(_pipeline));
    return _pipeline;
  } catch (err) {
    _waiters.forEach(w => w.reject(err));
    _loading = false;
    throw err;
  }
}

/**
 * Embed a single string.
 * @param {string} text
 * @returns {Promise<number[] | null>}  384-dimension float array, or null on error
 */
async function getEmbedding(text) {
  try {
    const pipe = await getPipeline();
    // mean pooling + L2 normalisation → unit vector ready for cosine similarity
    const output = await pipe(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  } catch (err) {
    console.error('[Embedding] Error:', err.message);
    return null;
  }
}

module.exports = { getEmbedding };
