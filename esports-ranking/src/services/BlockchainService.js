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


/**
 * Cập nhật điểm trận đấu
 * @param {number} matchId 
 * @param {number} scoreA 
 * @param {number} scoreB 
 */
export const updateMatchScoreOnChain = async (matchId, scoreA, scoreB) => {
  const tx = await leaderboardContract.updateMatchScore(matchId, scoreA, scoreB);
  const receipt = await tx.wait(1);
  return { txHash: tx.hash, blockNumber: receipt.blockNumber };
};

/**
 * Lấy điểm 1 trận
 * @param {number} matchId 
 */
export const getMatchScoreFromChain = async (matchId) => {
  const [scoreA, scoreB] = await leaderboardContract.getMatchScore(matchId);
  return { scoreA: Number(scoreA), scoreB: Number(scoreB) };
};

/**
 * Lấy toàn bộ trận của 1 giải đấu
 * @param {number} tournamentId 
 */
export const getMatchesByTournamentFromChain = async (tournamentId) => {
  const matches = await leaderboardContract.getMatchesByTournament(tournamentId);
  // convert BigInt to Number
  return matches.map(m => ({
    tournamentId: Number(m.tournamentId),
    roundNumber: Number(m.roundNumber),
    matchId: Number(m.matchCount), // matchId không có trong struct, cần quản lý bên backend
    teamA: m.teamA,
    teamB: m.teamB,
    scoreA: Number(m.scoreA),
    scoreB: Number(m.scoreB),
    updatedAt: Number(m.updatedAt),
    updatedBy: m.updatedBy
  }));
};