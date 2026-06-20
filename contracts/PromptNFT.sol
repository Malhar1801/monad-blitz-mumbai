// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title ITrainingRegistry
 * @notice Minimal interface used by PromptNFT to gate minting.
 */
interface ITrainingRegistry {
    function isExpertWallet(address wallet) external view returns (bool);
}

/**
 * @title PromptNFT
 * @author PromptFi
 * @notice ERC-721 marketplace for scored, verified prompts.
 *
 * @dev SECURITY MODEL CHANGE FROM ORIGINAL:
 *      `mintPrompt` is now `onlyOwner`. The owner is the PromptFi backend signer.
 *      Scores are produced by the 4 off-chain AI agents and the >=70 overall-score
 *      gate is meaningless unless the contract enforces it itself — anyone could
 *      otherwise call mintPrompt directly with fabricated scores. Since the contract
 *      has no way to independently verify agent output, the only trust-preserving
 *      options are (a) restrict minting to the trusted backend signer, or
 *      (b) verify an EIP-712 signature from a trusted attester on-chain.
 *      This patch takes option (a) — simpler, and consistent with the fact that
 *      the backend already signs every other on-chain write in this system.
 *      The backend is responsible for checking isExpertWallet(creator) and
 *      overallScore >= 70 BEFORE calling this function, and passing the real
 *      creator address through explicitly (see `creator` param below).
 */
contract PromptNFT is ERC721, Ownable, ReentrancyGuard {
    // ──────────────────── Types ────────────────────

    /// @notice Rich metadata attached to every minted prompt NFT.
    struct PromptMetadata {
        string ipfsHash;
        uint256 clarityScore;
        uint256 structureScore;
        uint256 originalityScore;
        uint256 outputScore;
        uint256 overallScore;
        bool isVerified;
        address creatorWallet;
        uint256 price;
        bool isListed;
    }

    // ──────────────────── Constants ────────────────

    /// @notice Minimum overall score required to mint, enforced on-chain.
    uint256 public constant MIN_MINT_SCORE = 70;

    // ──────────────────── State ────────────────────

    /// @notice Total number of minted tokens (also next token ID).
    uint256 public tokenCount;

    /// @notice Per-token metadata.
    mapping(uint256 => PromptMetadata) public prompts;

    /// @notice Address of the deployed TrainingRegistry contract.
    address public trainingRegistryAddress;

    // ──────────────────── Events ───────────────────

    /// @notice Emitted when a new prompt NFT is minted.
    event PromptMinted(uint256 indexed tokenId, address indexed creator, string ipfsHash, uint256 overallScore);

    /// @notice Emitted when a prompt is listed (or re-listed) for sale.
    event PromptListed(uint256 indexed tokenId, uint256 price);

    /// @notice Emitted when a prompt is taken off the marketplace without a sale.
    event PromptUnlisted(uint256 indexed tokenId);

    /// @notice Emitted when a prompt is purchased on the marketplace.
    event PromptPurchased(uint256 indexed tokenId, address indexed buyer, uint256 price);

    /// @notice Emitted when the TrainingRegistry pointer is updated.
    event TrainingRegistryUpdated(address indexed oldRegistry, address indexed newRegistry);

    // ──────────────────── Constructor ──────────────

    /**
     * @param _trainingRegistryAddress Address of the TrainingRegistry used for
     *        expert-wallet verification.
     */
    constructor(
        address _trainingRegistryAddress
    ) ERC721("PromptFi", "PFI") Ownable(msg.sender) {
        require(_trainingRegistryAddress != address(0), "PromptNFT: zero registry address");
        trainingRegistryAddress = _trainingRegistryAddress;
    }

    // ──────────────────── External / Owner ─────────

    /**
     * @notice Mints a new prompt NFT on behalf of a verified expert creator.
     * @dev Callable only by the contract owner (the PromptFi backend signer).
     *      The backend MUST verify, before calling this:
     *        1. ITrainingRegistry(trainingRegistryAddress).isExpertWallet(creator) == true
     *        2. overallScore (computed off-chain from `scores`) >= MIN_MINT_SCORE
     *      This function re-checks #2 on-chain as a defense-in-depth backstop,
     *      since the score math itself is trivial and cheap to verify here.
     * @param creator   Wallet that gets credited as creator and receives the NFT.
     * @param ipfsHash  IPFS CID of the prompt content + metadata.
     * @param scores    [clarity, structure, originality, output] — each 0-100.
     * @param price     Initial listing price in wei (native MON).
     */
    function mintPrompt(
        address creator,
        string memory ipfsHash,
        uint256[4] memory scores,
        uint256 price
    ) external onlyOwner returns (uint256) {
        require(creator != address(0), "PromptNFT: zero creator address");
        require(bytes(ipfsHash).length > 0, "PromptNFT: empty ipfsHash");
        for (uint256 i; i < 4; ++i) {
            require(scores[i] <= 100, "PromptNFT: score out of range");
        }

        uint256 overallScore = (scores[0] + scores[1] + scores[2] + scores[3]) / 4;
        require(overallScore >= MIN_MINT_SCORE, "PromptNFT: overallScore below mint threshold");

        uint256 tokenId = tokenCount;

        prompts[tokenId] = PromptMetadata({
            ipfsHash: ipfsHash,
            clarityScore: scores[0],
            structureScore: scores[1],
            originalityScore: scores[2],
            outputScore: scores[3],
            overallScore: overallScore,
            isVerified: true, // agent-evaluated and score-gated at mint time
            creatorWallet: creator,
            price: price,
            isListed: true
        });

        _mint(creator, tokenId);
        tokenCount++;

        emit PromptMinted(tokenId, creator, ipfsHash, overallScore);
        return tokenId;
    }

    /**
     * @notice Repoints this contract at a new TrainingRegistry deployment.
     * @dev Needed because trainingRegistryAddress is not immutable — useful while
     *      iterating on testnet, where TrainingRegistry may be redeployed without
     *      wanting to redeploy (and lose state in) PromptNFT.
     */
    function setTrainingRegistry(address _trainingRegistryAddress) external onlyOwner {
        require(_trainingRegistryAddress != address(0), "PromptNFT: zero registry address");
        address old = trainingRegistryAddress;
        trainingRegistryAddress = _trainingRegistryAddress;
        emit TrainingRegistryUpdated(old, _trainingRegistryAddress);
    }

    // ──────────────────── External / Token Owner ───

    /**
     * @notice Lists (or re-lists) a prompt for sale on the marketplace.
     * @param tokenId  Token to list.
     * @param price    Asking price in wei. Must be > 0.
     */
    function listPrompt(uint256 tokenId, uint256 price) external {
        require(ownerOf(tokenId) == msg.sender, "PromptNFT: caller is not token owner");
        require(price > 0, "PromptNFT: price must be greater than zero");

        prompts[tokenId].isListed = true;
        prompts[tokenId].price = price;

        emit PromptListed(tokenId, price);
    }

    /**
     * @notice Removes a prompt from the marketplace without selling it.
     * @param tokenId  Token to unlist.
     */
    function unlistPrompt(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "PromptNFT: caller is not token owner");
        require(prompts[tokenId].isListed, "PromptNFT: token is not listed");

        prompts[tokenId].isListed = false;

        emit PromptUnlisted(tokenId);
    }

    /**
     * @notice Purchases a listed prompt. Sends the listing price to the seller,
     *         refunds any overpayment to the buyer, and transfers the NFT.
     * @param tokenId  Token to purchase.
     */
    function buyPrompt(uint256 tokenId) external payable nonReentrant {
        PromptMetadata storage meta = prompts[tokenId];
        require(meta.isListed, "PromptNFT: token is not listed");
        require(msg.value >= meta.price, "PromptNFT: insufficient payment");

        address seller = ownerOf(tokenId);
        require(seller != msg.sender, "PromptNFT: cannot buy your own listing");

        uint256 salePrice = meta.price;
        uint256 refund = msg.value - salePrice;

        // Effects before interactions.
        meta.isListed = false;

        // Transfer NFT to buyer.
        _transfer(seller, msg.sender, tokenId);

        // Pay seller exactly the listing price.
        (bool sentToSeller, ) = payable(seller).call{value: salePrice}("");
        require(sentToSeller, "PromptNFT: payment to seller failed");

        // Refund any overpayment to buyer.
        if (refund > 0) {
            (bool sentRefund, ) = payable(msg.sender).call{value: refund}("");
            require(sentRefund, "PromptNFT: refund to buyer failed");
        }

        emit PromptPurchased(tokenId, msg.sender, salePrice);
    }

    // ──────────────────── External / View ──────────

    /**
     * @notice Returns the full metadata struct for a given token.
     */
    function getPromptMetadata(uint256 tokenId) external view returns (PromptMetadata memory) {
        return prompts[tokenId];
    }

    /**
     * @notice Returns an array of every token ID that is currently listed.
     * @dev Unbounded loop over tokenCount — fine for testnet/moderate marketplace
     *      sizes, but consider an off-chain indexer (e.g. subgraph) or paginated
     *      view if the collection grows large.
     */
    function getAllListedTokenIds() external view returns (uint256[] memory) {
        uint256 listedCount;
        for (uint256 i; i < tokenCount; ++i) {
            if (prompts[i].isListed) {
                listedCount++;
            }
        }

        uint256[] memory result = new uint256[](listedCount);
        uint256 idx;
        for (uint256 i; i < tokenCount; ++i) {
            if (prompts[i].isListed) {
                result[idx] = i;
                idx++;
            }
        }

        return result;
    }

    /**
     * @notice Standard ERC-721 metadata URI, points at the IPFS JSON for this token.
     * @dev Assumes ipfsHash points to a standard ERC-721 metadata JSON object
     *      (name, description, image, attributes) uploaded to Pinata.
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return string(abi.encodePacked("ipfs://", prompts[tokenId].ipfsHash));
    }
}
