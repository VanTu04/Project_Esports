// contracts/Leaderboard.sol
pragma solidity ^0.8.19;

// (Nên thêm dòng này để debug dễ hơn)
import "hardhat/console.sol";

contract Leaderboard {
    address public owner;
    mapping(address => uint256) public scores;

    event ScoreUpdated(address indexed team, uint256 newScore);

    constructor() {
        owner = msg.sender;
        console.log("Leaderboard deployed by:", msg.sender);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    function addPoints(address _team, uint256 _pointsToAdd) public onlyOwner {
        uint256 oldScore = scores[_team];
        uint256 newScore = oldScore + _pointsToAdd;
        
        scores[_team] = newScore;
        emit ScoreUpdated(_team, newScore);
    }

    function getScore(address _team) public view returns (uint256) {
        return scores[_team];
    }
}