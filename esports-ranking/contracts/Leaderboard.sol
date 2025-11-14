// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Leaderboard {
    address public owner;

    // Lưu leaderboard dạng JSON string: tournamentId => roundNumber => jsonData
    mapping(uint256 => mapping(uint256 => string)) private leaderboardJson;

    event LeaderboardUpdatedJSON(
        uint256 indexed tournamentId,
        uint256 indexed roundNumber,
        string jsonData
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // === Ghi BXH dạng JSON ===
    function updateLeaderboardJSON(
        uint256 tournamentId,
        uint256 roundNumber,
        string memory jsonData
    ) public onlyOwner {
        leaderboardJson[tournamentId][roundNumber] = jsonData;
        emit LeaderboardUpdatedJSON(tournamentId, roundNumber, jsonData);
    }

    // === Lấy BXH dạng JSON ===
    function getLeaderboardJSON(
        uint256 tournamentId,
        uint256 roundNumber
    ) public view returns (string memory) {
        string memory data = leaderboardJson[tournamentId][roundNumber];
        require(bytes(data).length > 0, "No leaderboard found");
        return data;
    }

    // === Admin phân phối ETH ===
    function distribute(address to, uint256 amountWei) public onlyOwner {
        require(to != address(0), "Invalid recipient");
        require(amountWei > 0, "Amount must be > 0");
        payable(to).transfer(amountWei);
    }

    // === Nhận ETH vào contract ===
    receive() external payable {}
}
