// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract EsportsRanking {
    address public admin;

    event RewardsDistributed(uint256 tournamentId, address[] winners, uint256[] amounts);

    constructor() {
        admin = msg.sender;
    }

    // Receive funds to contract
    receive() external payable {}

    // Distribute ETH to winners (admin only)
    function distributeRewards(uint256 tournamentId, address[] memory winners, uint256[] memory amounts) external {
        require(msg.sender == admin, "Only admin");
        require(winners.length == amounts.length, "Length mismatch");

        for (uint256 i = 0; i < winners.length; i++) {
            payable(winners[i]).transfer(amounts[i]);
        }

        emit RewardsDistributed(tournamentId, winners, amounts);
    }

    // Helpers
    function getAdmin() external view returns (address) {
        return admin;
    }
}
