/**
 * scripts/setExpert.js
 *
 * Dev tool — force Expert status on any wallet by logging enough
 * high-score attempts to push the on-chain average to >= 75.
 * Dynamically calculates how many attempts are needed.
 *
 * Usage:
 *   node scripts/setExpert.js <walletAddress>
 *
 * Example:
 *   node scripts/setExpert.js 0x15ac09fd93f61703ae1995e8d0c90d15ce1f0747
 */

require('dotenv').config();
const { ethers } = require('ethers');

const TARGET_WALLET = process.argv[2];

if (!TARGET_WALLET || !/^0x[0-9a-fA-F]{40}$/.test(TARGET_WALLET)) {
  console.error('Usage: node scripts/setExpert.js <walletAddress>');
  process.exit(1);
}

const SCORE = 100; // use max score to minimise required attempts
const TARGET_AVG = 75;

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.MONAD_RPC_URL);
  const signer   = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const addresses = require('../config/addresses.json');
  const abi = require('../artifacts/contracts/TrainingRegistry.sol/TrainingRegistry.json').abi;
  const contract = new ethers.Contract(addresses.trainingRegistry, abi, signer);

  console.log('════════════════════════════════════════');
  console.log('  PromptFi — Set Expert (Dev Tool)');
  console.log('════════════════════════════════════════');
  console.log(`Target wallet : ${TARGET_WALLET}`);
  console.log(`Owner (signer): ${signer.address}`);

  // ── Read current state ───────────────────────────────────────────────────────
  const [avgBig, isExpert, countBig] = await Promise.all([
    contract.getAverageScore(TARGET_WALLET),
    contract.isExpertWallet(TARGET_WALLET),
    contract.getAttemptCount(TARGET_WALLET),
  ]);
  const currentAvg   = Number(avgBig);
  const currentCount = Number(countBig);
  // Reconstruct approximate total (integer maths matches Solidity)
  const currentTotal = currentAvg * currentCount;

  console.log(`\nCurrent state:`);
  console.log(`  Attempt count : ${currentCount}`);
  console.log(`  Average score : ${currentAvg}`);
  console.log(`  Approx total  : ${currentTotal}`);
  console.log(`  Is expert     : ${isExpert}`);

  if (isExpert) {
    console.log('\n✓ Already an expert! No changes needed.');
    process.exit(0);
  }

  // ── Calculate attempts needed ────────────────────────────────────────────────
  // We need: (currentTotal + SCORE * n) / (currentCount + n) >= TARGET_AVG
  // Solve: n >= (TARGET_AVG * currentCount - currentTotal) / (SCORE - TARGET_AVG)
  let attemptsNeeded = 0;
  if (currentAvg < TARGET_AVG) {
    attemptsNeeded = Math.ceil(
      (TARGET_AVG * currentCount - currentTotal) / (SCORE - TARGET_AVG)
    );
  }
  // Add 1 extra to absorb Solidity integer rounding
  attemptsNeeded = Math.max(attemptsNeeded + 1, 3);

  // Verify with simulation
  const simTotal   = currentTotal + SCORE * attemptsNeeded;
  const simCount   = currentCount + attemptsNeeded;
  const simAvg     = Math.floor(simTotal / simCount);  // matches Solidity integer div
  console.log(`\nPlan: ${attemptsNeeded} × score ${SCORE}`);
  console.log(`  Projected average : ${simAvg} (need >= ${TARGET_AVG}) → ${simAvg >= TARGET_AVG ? '✓' : '✗'}`);

  // ── Log attempts ─────────────────────────────────────────────────────────────
  console.log(`\nLogging ${attemptsNeeded} attempts with score ${SCORE}...`);
  for (let i = 0; i < attemptsNeeded; i++) {
    process.stdout.write(`  [${i + 1}/${attemptsNeeded}] sending tx...`);
    const tx      = await contract.logChallengeAttempt(TARGET_WALLET, (i % 10) + 1, SCORE);
    const receipt = await tx.wait();
    console.log(` ✓ https://testnet.monadexplorer.com/tx/${receipt.hash}`);
  }

  // ── Trigger expert check ─────────────────────────────────────────────────────
  console.log('\nTriggering checkAndSetExpert...');
  const expertTx      = await contract.checkAndSetExpert(TARGET_WALLET);
  const expertReceipt = await expertTx.wait();
  console.log(`✓ https://testnet.monadexplorer.com/tx/${expertReceipt.hash}`);

  // ── Verify ───────────────────────────────────────────────────────────────────
  const [finalAvg, finalExpert, finalCount] = await Promise.all([
    contract.getAverageScore(TARGET_WALLET),
    contract.isExpertWallet(TARGET_WALLET),
    contract.getAttemptCount(TARGET_WALLET),
  ]);

  console.log('\n════════════════════════════════════════');
  console.log('  RESULT');
  console.log('════════════════════════════════════════');
  console.log(`  Average score : ${finalAvg}`);
  console.log(`  Attempt count : ${finalCount}`);
  console.log(`  Is expert     : ${finalExpert}`);

  if (finalExpert) {
    console.log(`\n✓ ${TARGET_WALLET}`);
    console.log(`  → EXPERT STATUS ACTIVE — can now mint prompts!`);
  } else {
    console.log(`\n✗ Still not expert (avg = ${finalAvg}). Try running again.`);
  }
}

main().catch((err) => {
  console.error('\n[FATAL]', err.message);
  process.exit(1);
});
