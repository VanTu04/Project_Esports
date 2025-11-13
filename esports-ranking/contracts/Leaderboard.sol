// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Leaderboard {
    address public owner;

    struct ParticipantScore {
        address participant;
        uint256 score;
    }

    struct RoundLeaderboard {
        uint256 tournamentId;
        uint256 roundNumber;
        ParticipantScore[] participants;
    }

    mapping(uint256 => RoundLeaderboard[]) private tournamentRounds;

    event LeaderboardUpdated(
        uint256 indexed tournamentId,
        uint256 indexed roundNumber,
        address[] participants,
        uint256[] scores
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // === Ghi BXH vòng đấu ===
    function updateLeaderboard(
        uint256 tournamentId,
        uint256 roundNumber,
        address[] memory participants,
        uint256[] memory scores
    ) public onlyOwner {
        require(participants.length == scores.length, "Mismatched lengths");

        // Copy participants & scores vào memory
        ParticipantScore[] memory ps = new ParticipantScore[](participants.length);
        for (uint i = 0; i < participants.length; i++) {
            ps[i] = ParticipantScore(participants[i], scores[i]);
        }

        // Lưu vào storage
        RoundLeaderboard storage newRound = tournamentRounds[tournamentId].push();
        newRound.tournamentId = tournamentId;
        newRound.roundNumber = roundNumber;
        for (uint i = 0; i < ps.length; i++) {
            newRound.participants.push(ps[i]);
        }

        emit LeaderboardUpdated(tournamentId, roundNumber, participants, scores);
    }

    // === Lấy BXH vòng đấu ===
    function getLeaderboard(uint256 tournamentId, uint256 roundNumber)
        public
        view
        returns (address[] memory participants, uint256[] memory scores)
    {
        uint roundsCount = tournamentRounds[tournamentId].length;
        require(roundsCount > 0, "No rounds found");

        // Tìm round phù hợp
        uint index = roundsCount; // invalid index ban đầu
        for (uint i = 0; i < roundsCount; i++) {
            if (tournamentRounds[tournamentId][i].roundNumber == roundNumber) {
                index = i;
                break;
            }
        }
        require(index < roundsCount, "Round not found");

        uint len = tournamentRounds[tournamentId][index].participants.length;
        participants = new address[](len);
        scores = new uint256[](len);

        for (uint i = 0; i < len; i++) {
            participants[i] = tournamentRounds[tournamentId][index].participants[i].participant;
            scores[i] = tournamentRounds[tournamentId][index].participants[i].score;
        }
    }

    // === Admin phân phối ETH cho 1 người ===
    function distribute(address to, uint256 amountWei) public onlyOwner {
        require(to != address(0), "Invalid recipient");
        require(amountWei > 0, "Amount must be > 0");
        payable(to).transfer(amountWei);
    }

    // Nhận ETH vào contract
    receive() external payable {}
}
