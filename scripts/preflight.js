/**
 * preflight.js — Run this before deploying or seeding.
 * Checks: .env keys, MongoDB connection, Pinata auth, Gemini API, embedding model.
 *
 * Usage: node scripts/preflight.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const REQUIRED_KEYS = ['GEMINI_API_KEY', 'PINATA_API_KEY', 'PINATA_SECRET', 'PRIVATE_KEY', 'MONAD_RPC_URL'];
const OPTIONAL_KEYS = ['MONGODB_URI', 'PORT'];

async function check(label, fn) {
  process.stdout.write(`  ${label.padEnd(30)}`);
  try {
    await fn();
    console.log('✓ OK');
    return true;
  } catch (e) {
    console.log(`✗ FAIL — ${e.message}`);
    return false;
  }
}

async function main() {
  console.log('\n════════════════════════════════════════');
  console.log('  PromptFi — Pre-flight Check');
  console.log('════════════════════════════════════════\n');

  let allGood = true;

  // ── 1. Environment variables ─────────────────────────────────────────────
  console.log('[ ENV KEYS ]');
  for (const key of REQUIRED_KEYS) {
    const ok = await check(key, () => {
      if (!process.env[key] || process.env[key].length < 4)
        throw new Error(`Missing or empty in .env`);
    });
    if (!ok) allGood = false;
  }
  for (const key of OPTIONAL_KEYS) {
    await check(`${key} (optional)`, () => {
      if (!process.env[key]) throw new Error('Not set — using default');
    });
  }

  // ── 2. MongoDB ────────────────────────────────────────────────────────────
  console.log('\n[ MONGODB ]');
  const mongoOk = await check('Connection', async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/promptfi');
    await mongoose.disconnect();
  });
  if (!mongoOk) allGood = false;

  // ── 3. Pinata ─────────────────────────────────────────────────────────────
  console.log('\n[ PINATA / IPFS ]');
  const pinataOk = await check('Auth test', async () => {
    const pinataSDK = require('@pinata/sdk');
    const pinata = new pinataSDK(process.env.PINATA_API_KEY, process.env.PINATA_SECRET);
    const result = await pinata.testAuthentication();
    if (!result.authenticated) throw new Error('Pinata auth failed');
  });
  if (!pinataOk) allGood = false;

  // ── 4. Gemini ─────────────────────────────────────────────────────────────
  console.log('\n[ GEMINI API ]');
  const geminiOk = await check('gemini-2.5-flash ping', async () => {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent('Say "OK" in one word.');
    const text = result.response.text();
    if (!text) throw new Error('Empty response');
  });
  if (!geminiOk) allGood = false;

  // ── 5. Monad RPC ──────────────────────────────────────────────────────────
  console.log('\n[ MONAD TESTNET ]');
  const rpcOk = await check('RPC connectivity', async () => {
    const { ethers } = require('ethers');
    const provider = new ethers.JsonRpcProvider(process.env.MONAD_RPC_URL);
    const block = await provider.getBlockNumber();
    if (!block && block !== 0) throw new Error('Could not get block number');
  });
  if (!rpcOk) allGood = false;

  const walletOk = await check('Deployer wallet balance', async () => {
    const { ethers } = require('ethers');
    const provider = new ethers.JsonRpcProvider(process.env.MONAD_RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const balance = await provider.getBalance(wallet.address);
    const mon = parseFloat(ethers.formatEther(balance));
    console.log(`\n    Address: ${wallet.address}`);
    console.log(`    Balance: ${mon} MON`);
    process.stdout.write(`  ${'Wallet balance check'.padEnd(30)}`);
    if (mon < 0.1) throw new Error(`Low balance: ${mon} MON — get testnet MON from faucet`);
  });
  if (!walletOk) allGood = false;

  // ── 6. Embedding model ────────────────────────────────────────────────────
  console.log('\n[ LOCAL EMBEDDING MODEL ]');
  const embedOk = await check('Xenova/all-MiniLM-L6-v2', async () => {
    const { getEmbedding } = require('../services/embeddingService');
    const emb = await getEmbedding('preflight test');
    if (!emb || emb.length !== 384) throw new Error('Bad embedding output');
  });
  if (!embedOk) allGood = false;

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n════════════════════════════════════════');
  if (allGood) {
    console.log('  ✓ ALL CHECKS PASSED — ready to deploy!');
    console.log('\n  Next steps:');
    console.log('    1. npm run deploy');
    console.log('    2. Fill frontend/.env.local with printed addresses');
    console.log('    3. npm run seed:marketplace');
    console.log('    4. npm run dev');
  } else {
    console.log('  ✗ SOME CHECKS FAILED — fix above before deploying');
  }
  console.log('════════════════════════════════════════\n');

  process.exit(allGood ? 0 : 1);
}

main().catch(err => {
  console.error('\n[FATAL]', err.message);
  process.exit(1);
});
