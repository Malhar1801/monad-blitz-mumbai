const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider(process.env.MONAD_RPC_URL);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Lazy-loaded contract instances (cached after first call)
let _trainingRegistry = null;
let _promptNFT = null;

/**
 * Get the TrainingRegistry contract instance.
 * Tracks wallet training attempts and expert status on-chain.
 * @returns {ethers.Contract}
 */
function getTrainingRegistry() {
  if (!_trainingRegistry) {
    const TrainingRegistryABI = require('../artifacts/contracts/TrainingRegistry.sol/TrainingRegistry.json');
    const addresses = require('../config/addresses.json');
    _trainingRegistry = new ethers.Contract(
      addresses.trainingRegistry,
      TrainingRegistryABI.abi,
      signer
    );
  }
  return _trainingRegistry;
}

/**
 * Get the PromptNFT contract instance.
 * ERC-721 marketplace — minting, listing, and buying prompts.
 * NOTE: ChallengeRegistry has been removed. Challenges now live in challenges.json.
 * @returns {ethers.Contract}
 */
function getPromptNFT() {
  if (!_promptNFT) {
    const PromptNFTABI = require('../artifacts/contracts/PromptNFT.sol/PromptNFT.json');
    const addresses = require('../config/addresses.json');
    _promptNFT = new ethers.Contract(
      addresses.promptNFT,
      PromptNFTABI.abi,
      signer
    );
  }
  return _promptNFT;
}

module.exports = {
  provider,
  signer,
  getTrainingRegistry,
  getPromptNFT,
};
