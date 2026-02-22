// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract PromptFi is ERC721 {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    uint256 public constant ROYALTY_PERCENT = 10; // 10%

    struct Prompt {
        string ipfsHash;
        uint256 price;
        address creator;
        bool active;
        string category;
        uint256 totalRating;
        uint256 ratingCount;
    }

    mapping(uint256 => Prompt) public prompts;

    constructor() ERC721("PromptFi", "PROMPT") {}

    /* ========== CORE FEATURES ========== */

    /// Create Prompt NFT
    function createPrompt(
        string memory ipfsHash,
        uint256 price,
        string memory category
    ) external {
        require(price > 0, "Price must be > 0");

        _tokenIds.increment();
        uint256 tokenId = _tokenIds.current();

        _mint(msg.sender, tokenId);

        prompts[tokenId] = Prompt(
            ipfsHash,
            price,
            msg.sender,
            true,
            category,
            0,
            0
        );
    }

    /// Buy Prompt NFT
    function buyPrompt(uint256 tokenId) external payable {
        Prompt storage p = prompts[tokenId];

        require(p.active, "Prompt inactive");
        require(msg.value == p.price, "Incorrect price");

        address seller = ownerOf(tokenId);

        uint256 royalty = (msg.value * ROYALTY_PERCENT) / 100;
        uint256 sellerAmount = msg.value - royalty;

        payable(p.creator).transfer(royalty);
        payable(seller).transfer(sellerAmount);

        _transfer(seller, msg.sender, tokenId);
    }

    /// Reveal Prompt (only owner)
    function revealPrompt(uint256 tokenId)
        external
        view
        returns (string memory)
    {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        require(prompts[tokenId].active, "Prompt inactive");
        return prompts[tokenId].ipfsHash;
    }

    /* ========== ADVANCED FEATURES ========== */

    /// Update Price (Owner only)
    function updatePrice(uint256 tokenId, uint256 newPrice) external {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        require(newPrice > 0, "Invalid price");
        prompts[tokenId].price = newPrice;
    }

    /// Deactivate Prompt (Owner only)
    function deactivatePrompt(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        prompts[tokenId].active = false;
    }

    /// Rate Prompt (1–5)
    function ratePrompt(uint256 tokenId, uint256 rating) external {
        require(rating >= 1 && rating <= 5, "Invalid rating");
        require(ownerOf(tokenId) != msg.sender, "Owner cannot rate");

        Prompt storage p = prompts[tokenId];
        p.totalRating += rating;
        p.ratingCount += 1;
    }

    /* ========== FETCH FUNCTIONS (Frontend Friendly) ========== */

    /// Get average rating
    function getAverageRating(uint256 tokenId)
        external
        view
        returns (uint256)
    {
        Prompt memory p = prompts[tokenId];
        if (p.ratingCount == 0) return 0;
        return p.totalRating / p.ratingCount;
    }

    /// Marketplace fetch
    function getPrompt(uint256 tokenId)
        external
        view
        returns (
            uint256 price,
            address creator,
            bool active,
            string memory category,
            uint256 rating
        )
    {
        Prompt memory p = prompts[tokenId];
        uint256 avgRating = p.ratingCount == 0
            ? 0
            : p.totalRating / p.ratingCount;

        return (p.price, p.creator, p.active, p.category, avgRating);
    }

    /// My Prompts fetch
    function getMyPrompt(uint256 tokenId)
        external
        view
        returns (string memory)
    {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        return prompts[tokenId].ipfsHash;
    }
}