// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract EsportsRanking {
    address public admin;
    mapping(string => uint256) public rankings; // player/team -> score

    constructor() {
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call");
        _;
    }

    function setRanking(string memory team, uint256 score) public onlyAdmin {
        rankings[team] = score;
    }

    function getRanking(string memory team) public view returns (uint256) {
        return rankings[team];
    }
}
