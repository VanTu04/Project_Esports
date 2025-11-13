// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Leaderboard {
    address public owner;

    struct LeaderboardEntry {
        address participant;
        uint256 points;
    }

    struct RoundLeaderboard {
        uint256 tournamentId;
        uint256 roundNumber;
        LeaderboardEntry[] entries;
        uint256 updatedAt;
    }

    mapping(uint256 => mapping(uint256 => RoundLeaderboard)) public leaderboard; 
    // tournamentId => roundNumber => leaderboard

    event LeaderboardUpdated(
        uint256 indexed tournamentId,
        uint256 indexed roundNumber,
        address[] participants,
        uint256[] points,
        uint256 timestamp
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * Cập nhật bảng xếp hạng 1 vòng
     * @param tournamentId ID giải đấu
     * @param roundNumber Số vòng
     * @param participants Danh sách address participant
     * @param points Điểm tương ứng
     */
    function updateRoundLeaderboard(
        uint256 tournamentId,
        uint256 roundNumber,
        address[] calldata participants,
        uint256[] calldata points
    ) external onlyOwner {
        require(participants.length == points.length, "Participants and points length mismatch");

        RoundLeaderboard storage rl = leaderboard[tournamentId][roundNumber];
        rl.tournamentId = tournamentId;
        rl.roundNumber = roundNumber;
        rl.updatedAt = block.timestamp;

        delete rl.entries; // xóa dữ liệu cũ nếu có

        for (uint256 i = 0; i < participants.length; i++) {
            rl.entries.push(LeaderboardEntry({
                participant: participants[i],
                points: points[i]
            }));
        }

        emit LeaderboardUpdated(tournamentId, roundNumber, participants, points, block.timestamp);
    }

    /**
     * Lấy BXH vòng
     */
    function getRoundLeaderboard(uint256 tournamentId, uint256 roundNumber)
        external view returns (address[] memory participants, uint256[] memory points)
    {
        RoundLeaderboard storage rl = leaderboard[tournamentId][roundNumber];
        uint256 len = rl.entries.length;

        participants = new address[](len);
        points = new uint256[](len);

        for (uint256 i = 0; i < len; i++) {
            participants[i] = rl.entries[i].participant;
            points[i] = rl.entries[i].points;
        }
    }
}
