import { ethers } from 'ethers';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const rpcUrl = process.env.RPC_URL;
const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY;
const contractAddress = process.env.LEADERBOARD_CONTRACT_ADDRESS;

if (!rpcUrl || !adminPrivateKey || !contractAddress) {
  throw new Error("Missing RPC_URL, ADMIN_PRIVATE_KEY or LEADERBOARD_CONTRACT_ADDRESS");
}

const provider = new ethers.JsonRpcProvider(rpcUrl);
const adminWallet = new ethers.Wallet(adminPrivateKey, provider);

// Load ABI
const abiPath = path.resolve('./artifacts/contracts/Leaderboard.sol/Leaderboard.json');
const abiFile = fs.readFileSync(abiPath, 'utf8');
const { abi } = JSON.parse(abiFile);

const leaderboardContract = new ethers.Contract(contractAddress, abi, adminWallet);

export const createMatchOnChain = async (tournamentId, roundNumber, teamA, teamB) => {
  const tx = await leaderboardContract.createMatch(tournamentId, roundNumber, teamA, teamB || ethers.constants.AddressZero);
  const receipt = await tx.wait(1);
  // matchId = matchCount (trả về trong event, hoặc từ backend theo thứ tự tạo)
  const matchId = await leaderboardContract.matchCount();
  return { matchId: Number(matchId), txHash: tx.hash, blockNumber: receipt.blockNumber };
};

/**
 * Ghi BXH vòng lên blockchain
 * @param {number} tournamentId
 * @param {number} roundNumber
 * @param {Array} leaderboard - [{ participant_id, wallet_address, total_points }]
 */
export const writeLeaderboardToBlockchain = async (tournamentId, roundNumber, leaderboard) => {
  const participants = leaderboard.map(p => p.wallet_address);
  const points = leaderboard.map(p => p.total_points);

  const tx = await leaderboardContract.updateRoundLeaderboard(
    tournamentId,
    roundNumber,
    participants,
    points
  );

  const receipt = await tx.wait(1);

  return {
    txHash: tx.hash,
    blockNumber: receipt.blockNumber,
    tournamentId,
    roundNumber,
    participantCount: participants.length
  };
};


// === Ghi BXH vòng đấu ===
export const updateLeaderboardOnChain = async ({ tournamentId, roundNumber, participants, scores }) => {
  const tx = await leaderboardContract.updateLeaderboard(tournamentId, roundNumber, participants, scores);
  const receipt = await tx.wait();
  return { txHash: tx.hash, blockNumber: receipt.blockNumber };
};

// === Lấy BXH vòng đấu ===
export const getLeaderboardFromChain = async (tournamentId, roundNumber) => {
  const [addresses, points] = await leaderboardContract.getLeaderboard(tournamentId, roundNumber);
  return addresses.map((addr, i) => ({ address: addr, score: points[i].toNumber() }));
};

// === Phân phối ETH cho 1 người ===
export const distributeRewardOnChain = async (to, amountEther) => {
  const weiAmount = ethers.parseEther(amountEther.toString());
  const tx = await leaderboardContract.distribute(to, weiAmount);
  const receipt = await tx.wait();
  return { txHash: tx.hash, blockNumber: receipt.blockNumber };
};