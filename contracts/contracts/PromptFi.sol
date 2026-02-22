// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract PromptFi is ERC721 {
    uint256 private _tokenIds;
    uint256 public constant ROYALTY_PERCENT = 10;

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
    uint256[] public allTokenIds;

    constructor() ERC721("PromptFi", "PROMPT") {}

    function createPrompt(string memory ipfsHash, uint256 price, string memory category) external {
        require(price > 0, "Price must be > 0");
        _tokenIds++;
        uint256 tokenId = _tokenIds;
        _mint(msg.sender, tokenId);
        prompts[tokenId] = Prompt(ipfsHash, price, msg.sender, true, category, 0, 0);
        allTokenIds.push(tokenId);
    }

    function buyPrompt(uint256 tokenId) external payable {
        Prompt storage p = prompts[tokenId];
        require(p.active, "Prompt inactive");
        require(msg.value == p.price, "Incorrect price");
        address seller = ownerOf(tokenId);
        uint256 royalty = (msg.value * ROYALTY_PERCENT) / 100;
        payable(p.creator).transfer(royalty);
        payable(seller).transfer(msg.value - royalty);
        _transfer(seller, msg.sender, tokenId);
    }

    function revealPrompt(uint256 tokenId) external view returns (string memory) {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        return prompts[tokenId].ipfsHash;
    }

    function ratePrompt(uint256 tokenId, uint256 rating) external {
        require(rating >= 1 && rating <= 5, "Invalid rating");
        require(ownerOf(tokenId) != msg.sender, "Owner cannot rate");
        prompts[tokenId].totalRating += rating;
        prompts[tokenId].ratingCount += 1;
    }

    function getAllPrompts() external view returns (uint256[] memory) {
        return allTokenIds;
    }

    function getPromptDetails(uint256 tokenId) external view returns (
        uint256 price, address creator, bool active, string memory category, uint256 avgRating
    ) {
        Prompt memory p = prompts[tokenId];
        uint256 rating = p.ratingCount == 0 ? 0 : p.totalRating / p.ratingCount;
        return (p.price, p.creator, p.active, p.category, rating);
    }
}