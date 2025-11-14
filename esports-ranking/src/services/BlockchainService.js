import { ethers } from 'ethers';
import { leaderboardContract } from '../init/blockchain.js';

// ================= Ghi BXH =================
export const updateLeaderboardOnChain = async ({ tournamentId, roundNumber, participantsArr, scoresArr }) => {
  if (!Array.isArray(participantsArr) || !Array.isArray(scoresArr)) {
    throw new Error("participantsArr và scoresArr phải là mảng");
  }
  if (participantsArr.length !== scoresArr.length) {
    throw new Error("participantsArr và scoresArr phải có cùng độ dài");
  }

  const tx = await leaderboardContract.updateLeaderboard(
    tournamentId,
    roundNumber,
    participantsArr,
    scoresArr
  );

  const receipt = await tx.wait();
  return {
    txHash: tx.hash,
    blockNumber: receipt.blockNumber
  };
};

// ================= Lấy BXH =================
export const getLeaderboardFromChain = async (tournamentId, roundNumber) => {
  console.log("Getting leaderboard from chain for tournamentId:", tournamentId, "roundNumber:", roundNumber);

  const [participantsResult, scoresResult] = await leaderboardContract.getLeaderboard(tournamentId, roundNumber);

  // Chuyển Result sang array JS thuần
  const participants = Array.from(participantsResult);
  const scores = Array.from(scoresResult).map(s => Number(s)); // Convert bigint sang number

  console.log("participants:", participants, "scores:", scores);

  return participants.map((wallet, index) => ({
    wallet,
    score: scores[index]
  }));
};

// ================= Chia thưởng =================
export const distributeRewardOnChain = async (to, amountEther) => {
  if (!ethers.isAddress(to)) throw new Error("Địa chỉ nhận không hợp lệ");

  const weiAmount = ethers.parseEther(amountEther.toString());
  const tx = await leaderboardContract.distribute(to, weiAmount);
  const receipt = await tx.wait();
  return { txHash: tx.hash, blockNumber: receipt.blockNumber };
};
