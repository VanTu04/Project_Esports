// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "hardhat/console.sol";

contract Leaderboard {
    address public owner;

    struct MatchResult {
        uint256 tournamentId;
        uint256 roundNumber;
        address teamA;
        address teamB;
        uint256 scoreA;
        uint256 scoreB;
        uint256 updatedAt;
        address updatedBy;
    }

    mapping(uint256 => MatchResult) public matches; // matchId -> MatchResult
    uint256 public matchCount;

    event MatchCreated(
        uint256 indexed matchId,
        uint256 indexed tournamentId,
        uint256 roundNumber,
        address teamA,
        address teamB
    );

    event MatchUpdated(
        uint256 indexed matchId,
        uint256 scoreA,
        uint256 scoreB,
        address updatedBy,
        uint256 timestamp
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    constructor() {
        owner = msg.sender;
        console.log("Leaderboard deployed by:", msg.sender);
    }

    // === Tạo trận mới ===
    function createMatch(
        uint256 tournamentId,
        uint256 roundNumber,
        address teamA,
        address teamB
    ) public onlyOwner returns (uint256) {
        matchCount++;
        matches[matchCount] = MatchResult({
            tournamentId: tournamentId,
            roundNumber: roundNumber,
            teamA: teamA,
            teamB: teamB,
            scoreA: 0,
            scoreB: 0,
            updatedAt: block.timestamp,
            updatedBy: msg.sender
        });

        emit MatchCreated(matchCount, tournamentId, roundNumber, teamA, teamB);
        return matchCount;
    }

    // === Cập nhật điểm ===
    function updateMatchScore(
        uint256 matchId,
        uint256 scoreA,
        uint256 scoreB
    ) public onlyOwner {
        require(matchId > 0 && matchId <= matchCount, "Invalid matchId");

        MatchResult storage m = matches[matchId];
        m.scoreA = scoreA;
        m.scoreB = scoreB;
        m.updatedAt = block.timestamp;
        m.updatedBy = msg.sender;

        emit MatchUpdated(matchId, scoreA, scoreB, msg.sender, block.timestamp);
    }

    // === Lấy điểm ===
    function getMatchScore(uint256 matchId)
        public
        view
        returns (uint256, uint256)
    {
        MatchResult storage m = matches[matchId];
        return (m.scoreA, m.scoreB);
    }

    // === Lấy toàn bộ trận của 1 giải ===
    function getMatchesByTournament(uint256 tournamentId)
        public
        view
        returns (MatchResult[] memory)
    {
        uint256 count;
        for (uint256 i = 1; i <= matchCount; i++) {
            if (matches[i].tournamentId == tournamentId) {
                count++;
            }
        }

        MatchResult[] memory result = new MatchResult[](count);
        uint256 idx;
        for (uint256 i = 1; i <= matchCount; i++) {
            if (matches[i].tournamentId == tournamentId) {
                result[idx] = matches[i];
                idx++;
            }
        }
        return result;
    }
}
