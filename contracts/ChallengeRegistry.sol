// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ChallengeRegistry
 * @author PromptFi
 * @notice Stores prompt-engineering challenges that trainees can attempt.
 */
contract ChallengeRegistry is Ownable {
    // ──────────────────── Types ────────────────────

    /// @notice A single prompt-engineering challenge.
    struct Challenge {
        uint256 challengeId;
        string problemStatement;
        string category;
        bool isActive;
    }

    // ──────────────────── State ────────────────────

    /// @notice Auto-incrementing challenge counter (also serves as next ID).
    uint256 public challengeCount;

    /// @notice Challenge data keyed by ID.
    mapping(uint256 => Challenge) public challenges;

    // ──────────────────── Events ───────────────────

    /// @notice Emitted when a new challenge is added.
    event ChallengeAdded(uint256 indexed challengeId, string category);

    // ──────────────────── Constructor ──────────────

    /**
     * @notice Sets the deployer as the initial owner.
     */
    constructor() Ownable(msg.sender) {}

    // ──────────────────── External / Owner ─────────

    /**
     * @notice Creates a new active challenge.
     * @param problemStatement  Human-readable problem description.
     * @param category          Category tag (e.g. "Debugging", "Creative Writing").
     */
    function addChallenge(
        string memory problemStatement,
        string memory category
    ) external onlyOwner {
        uint256 id = challengeCount;
        challenges[id] = Challenge({
            challengeId: id,
            problemStatement: problemStatement,
            category: category,
            isActive: true
        });

        challengeCount++;

        emit ChallengeAdded(id, category);
    }

    // ──────────────────── External / View ──────────

    /**
     * @notice Returns the full Challenge struct for the given ID.
     */
    function getChallenge(uint256 challengeId) external view returns (Challenge memory) {
        return challenges[challengeId];
    }

    /**
     * @notice Returns an array of every currently-active challenge.
     */
    function getAllActiveChallenges() external view returns (Challenge[] memory) {
        // First pass: count active challenges.
        uint256 activeCount;
        for (uint256 i; i < challengeCount; ++i) {
            if (challenges[i].isActive) {
                activeCount++;
            }
        }

        // Second pass: populate return array.
        Challenge[] memory result = new Challenge[](activeCount);
        uint256 idx;
        for (uint256 i; i < challengeCount; ++i) {
            if (challenges[i].isActive) {
                result[idx] = challenges[i];
                idx++;
            }
        }

        return result;
    }
}
