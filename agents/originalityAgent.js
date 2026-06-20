/**
 * originalityAgent.js
 *
 * Checks prompt originality using:
 *   - Local sentence-transformer embeddings (Xenova/all-MiniLM-L6-v2)
 *   - Cosine similarity against all stored PromptEmbeddings in MongoDB
 *   - Gemini 2.0 Flash for actionable feedback (only if not plagiarism)
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getEmbedding }       = require('../services/embeddingService');
const PromptEmbedding        = require('../models/PromptEmbedding');
const { cosineSimilarity }   = require('./utils');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const FEEDBACK_SYSTEM = `You are an originality advisor for a prompt engineering marketplace.
A prompt has been compared against existing prompts using semantic similarity.
Provide 2-3 concise, actionable suggestions to make it more unique and differentiated.

Respond with valid JSON only:
{ "feedback": ["<suggestion 1>", "<suggestion 2>", "<suggestion 3>"] }`;

async function evaluateOriginality(promptText) {
  try {
    // ── 1. Embed the new prompt locally ───────────────────────────────────────
    const embedding = await getEmbedding(promptText);
    if (!embedding) {
      return { score: 50, feedback: ['Embedding failed — default score assigned'], isPlagiarism: false };
    }

    // ── 2. Load all stored embeddings from MongoDB ────────────────────────────
    const existing = await PromptEmbedding.find({}, { embedding: 1 }).lean();

    // ── 3. Compute max cosine similarity ─────────────────────────────────────
    let maxSimilarity = 0;
    for (const doc of existing) {
      if (doc.embedding?.length === embedding.length) {
        const sim = cosineSimilarity(embedding, doc.embedding);
        if (sim > maxSimilarity) maxSimilarity = sim;
      }
    }

    // ── 4. Score logic ────────────────────────────────────────────────────────
    const isPlagiarism = maxSimilarity > 0.85;
    const score = isPlagiarism ? 0 : Math.round((1 - maxSimilarity) * 100);

    // ── 5. Gemini feedback (skip if obvious plagiarism — waste of tokens) ─────
    let feedback = [];
    if (!isPlagiarism) {
      try {
        const model = genAI.getGenerativeModel({
          model: 'gemini-2.5-flash',
          systemInstruction: FEEDBACK_SYSTEM,
          generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 300 },
        });
        const userMsg = `This prompt has ${Math.round(maxSimilarity * 100)}% similarity to existing prompts. Prompt: ${promptText.slice(0, 800)}`;
        const result  = await model.generateContent(userMsg);
        const parsed  = JSON.parse(result.response.text());
        feedback = Array.isArray(parsed.feedback) ? parsed.feedback : [];
      } catch {
        feedback = ['Could not generate originality feedback'];
      }
    } else {
      feedback = ['This prompt is too similar to an existing listing — originality score zeroed'];
    }

    return { score, feedback, isPlagiarism };
  } catch (err) {
    console.error('[OriginalityAgent] Error:', err.message);
    return { score: 50, feedback: ['Originality evaluation failed — default score assigned'], isPlagiarism: false };
  }
}

module.exports = { evaluateOriginality };
