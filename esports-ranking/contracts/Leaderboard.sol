// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Leaderboard {
    struct Entry {
        string username;
        uint256 score;
    }

    Entry[] public leaderboard;

    function addEntry(string memory username, uint256 score) public {
        leaderboard.push(Entry(username, score));
    }

    function getLeaderboard() public view returns (Entry[] memory) {
        return leaderboard;
    }
}
