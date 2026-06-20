/**
 * PromptFi API — Entry Point
 *
 * Architecture (final):
 *   ON-CHAIN  (Monad): TrainingRegistry, PromptNFT
 *   IPFS     (Pinata): Prompt metadata (text, scores, generatedOutput)
 *   OFF-CHAIN (Backend): challenges.json, agent logic, MongoDB embeddings
 *
 * NOTE: ChallengeRegistry has been removed. Challenges live in challenges.json.
 *
 * Routes (all prefixed /api/):
 *   GET  /api                          Health check
 *   POST /api/training/submit          Submit training challenge attempt
 *   GET  /api/training/challenges      All active challenges (from JSON)
 *   GET  /api/training/progress/:w     Wallet avg score + expert status (on-chain)
 *   POST /api/mint                     Evaluate + mint NFT (expert only)
 *   GET  /api/marketplace              All listed prompts (on-chain)
 *   POST /api/buyer/find               Semantic search via Filter Agent (MongoDB)
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const trainingRoutes   = require('./routes/training');
const mintRoutes       = require('./routes/mint');
const marketplaceRoutes = require('./routes/marketplace');
const buyerRoutes      = require('./routes/buyer');
const accountRoutes    = require('./routes/account');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.get('/api', (_req, res) => {
  res.json({
    status: 'PromptFi API running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    architecture: {
      onChain: ['TrainingRegistry', 'PromptNFT'],
      offChain: ['challenges.json', 'agent logic', 'MongoDB embeddings'],
      ipfs: ['prompt metadata at mint time'],
    },
    endpoints: {
      trainingSubmit: 'POST /api/training/submit',
      trainingChallenges: 'GET /api/training/challenges',
      trainingProgress: 'GET /api/training/progress/:wallet',
      mint: 'POST /api/mint',
      marketplace: 'GET /api/marketplace',
      buyerFind: 'POST /api/buyer/find',
    },
  });
});

app.use('/api/training',   trainingRoutes);
app.use('/api/mint',       mintRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/buyer',      buyerRoutes);
app.use('/api/account',    accountRoutes);

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[Global Error]', err.message);
  res.status(500).json({ success: false, error: err.message || 'Internal server error' });
});

// ── MongoDB + Server Start ────────────────────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/promptfi';

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected:', MONGODB_URI);
    app.listen(PORT, () => {
      console.log(`PromptFi server running on port ${PORT}`);
      console.log(`Health: http://localhost:${PORT}/api`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });

module.exports = app;
