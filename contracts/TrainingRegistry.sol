// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TrainingRegistry
 * @author PromptFi
 * @notice Tracks per-wallet prompt-engineering training and grants expert status
 *         to wallets whose average challenge score meets the threshold.
 */
contract TrainingRegistry is Ownable {
    // ──────────────────── Types ────────────────────

    /// @notice A single scored challenge attempt.
    struct ChallengeAttempt {
        uint256 challengeId;
        uint256 score;
        uint256 timestamp;
    }

    // ──────────────────── State ────────────────────

    /// @notice All challenge attempts for a given wallet.
    mapping(address => ChallengeAttempt[]) private _attempts;

    /// @notice Whether a wallet has earned expert status.
    mapping(address => bool) public isExpert;

    // ──────────────────── Events ───────────────────

    /// @notice Emitted when a new challenge attempt is logged.
    event ChallengeAttemptLogged(address indexed wallet, uint256 challengeId, uint256 score);

    /// @notice Emitted when a wallet is promoted to expert.
    event ExpertStatusGranted(address indexed wallet);

    // ──────────────────── Constructor ──────────────

    /**
     * @notice Sets the deployer as the initial owner.
     */
    constructor() Ownable(msg.sender) {}

    // ──────────────────── External / Owner ─────────

    /**
     * @notice Records a challenge attempt for `wallet`.
     * @param wallet  The trainee's address.
     * @param challengeId  ID of the challenge attempted.
     * @param score  Score achieved (0–100).
     */
    function logChallengeAttempt(
        address wallet,
        uint256 challengeId,
        uint256 score
    ) external onlyOwner {
        _attempts[wallet].push(
            ChallengeAttempt({
                challengeId: challengeId,
                score: score,
                timestamp: block.timestamp
            })
        );

        emit ChallengeAttemptLogged(wallet, challengeId, score);
    }

    // ──────────────────── Public / View ────────────

    /**
     * @notice Returns the average score across all attempts for `wallet`.
     * @dev Returns 0 when the wallet has no recorded attempts.
     */
    function getAverageScore(address wallet) public view returns (uint256) {
        uint256 count = _attempts[wallet].length;
        if (count == 0) return 0;

        uint256 total;
        for (uint256 i; i < count; ++i) {
            total += _attempts[wallet][i].score;
        }
        return total / count;
    }

    /**
     * @notice Evaluates and (if eligible) grants expert status to `wallet`.
     * @dev Anyone may call this; the threshold is an average score >= 75.
     */
    function checkAndSetExpert(address wallet) external {
        uint256 avg = getAverageScore(wallet);
        if (avg >= 75) {
            isExpert[wallet] = true;
            emit ExpertStatusGranted(wallet);
        }
    }

    /**
     * @notice Convenience view: returns `true` when `wallet` is an expert.
     */
    function isExpertWallet(address wallet) external view returns (bool) {
        return isExpert[wallet];
    }

    /**
     * @notice Returns the number of challenge attempts recorded for `wallet`.
     */
    function getAttemptCount(address wallet) external view returns (uint256) {
        return _attempts[wallet].length;
    }
}
