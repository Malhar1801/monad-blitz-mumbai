import { ethers } from "ethers";

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

export const CONTRACT_ABI = [
  "function createPrompt(string memory ipfsHash, uint256 price, string memory category) external",
  "function buyPrompt(uint256 tokenId) external payable",
  "function revealPrompt(uint256 tokenId) external view returns (string memory)",
  "function getAllPrompts() external view returns (uint256[] memory)",
  "function getPromptDetails(uint256 tokenId) external view returns (uint256 price, address creator, bool active, string memory category, uint256 avgRating)",
  "function ratePrompt(uint256 tokenId, uint256 rating) external",
  "function ownerOf(uint256 tokenId) public view returns (address)"
];

export const getProvider = () => {
  if (typeof window === "undefined" || !window.ethereum) return null;
  return new ethers.providers.Web3Provider(window.ethereum);
};

export const getContract = async (needSigner = false) => {
  const provider = getProvider();
  if (!provider) throw new Error("MetaMask not found!");
  await provider.send("eth_requestAccounts", []);
  const signerOrProvider = needSigner ? provider.getSigner() : provider;
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signerOrProvider);
};