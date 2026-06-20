/**
 * PromptFi Deployment Script
 *
 * Deploys 2 contracts (ChallengeRegistry removed — challenges live in challenges.json):
 *   1. TrainingRegistry  — wallet attempt tracking + expert status
 *   2. PromptNFT         — ERC-721 marketplace (depends on TrainingRegistry address)
 *
 * Writes deployed addresses to config/addresses.json.
 * Run: npx hardhat run scripts/deploy.js --network monad
 */

const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying with account:', deployer.address);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log('Deployer balance:', ethers.formatEther(balance), 'MON\n');

  // ── 1. TrainingRegistry ───────────────────────────────────────────────────
  console.log('Deploying TrainingRegistry...');
  const TrainingRegistry = await ethers.getContractFactory('TrainingRegistry');
  const trainingRegistry = await TrainingRegistry.deploy();
  await trainingRegistry.waitForDeployment();
  const trainingRegistryAddress = await trainingRegistry.getAddress();
  console.log('✓ TrainingRegistry deployed at:', trainingRegistryAddress);

  // ── 2. PromptNFT ──────────────────────────────────────────────────────────
  console.log('\nDeploying PromptNFT...');
  const PromptNFT = await ethers.getContractFactory('PromptNFT');
  const promptNFT = await PromptNFT.deploy(trainingRegistryAddress);
  await promptNFT.waitForDeployment();
  const promptNFTAddress = await promptNFT.getAddress();
  console.log('✓ PromptNFT deployed at:', promptNFTAddress);

  // ── Write addresses.json ──────────────────────────────────────────────────
  const addresses = {
    trainingRegistry: trainingRegistryAddress,
    promptNFT: promptNFTAddress,
  };

  const configDir = path.join(__dirname, '..', 'config');
  if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });

  fs.writeFileSync(
    path.join(configDir, 'addresses.json'),
    JSON.stringify(addresses, null, 2)
  );

  console.log('\n✓ addresses.json written to config/');
  console.log('\n── Deployed Addresses ─────────────────────');
  console.log('TrainingRegistry :', trainingRegistryAddress);
  console.log('PromptNFT        :', promptNFTAddress);
  console.log('────────────────────────────────────────────');
  console.log('\nPaste these into frontend/.env.local:');
  console.log(`NEXT_PUBLIC_TRAINING_REGISTRY_ADDRESS=${trainingRegistryAddress}`);
  console.log(`NEXT_PUBLIC_PROMPT_NFT_ADDRESS=${promptNFTAddress}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
