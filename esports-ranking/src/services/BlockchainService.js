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

/**
 * Lấy số dư ETH của một ví
 */
export const getWalletBalance = async (address) => {
  if (!ethers.isAddress(address)) throw new Error("Địa chỉ ví không hợp lệ");
  const balanceWei = await provider.getBalance(address);
  return parseFloat(ethers.formatEther(balanceWei));
};

/**
 * Lấy lịch sử giao dịch dựa trên event Distribute
 */
export const getWalletTransactions = async (address) => {
  if (!ethers.isAddress(address)) throw new Error("Địa chỉ ví không hợp lệ");

  // Event phải có trong ABI: Distribute(address indexed to, uint256 amountWei)
  const filter = leaderboardContract.filters.Distribute(address);
  const events = await leaderboardContract.queryFilter(filter, 0, "latest");

  const txs = await Promise.all(events.map(async (e) => {
    const block = await provider.getBlock(e.blockNumber);
    return {
      txHash: e.transactionHash,
      to: e.args.to,
      amount: parseFloat(ethers.formatEther(e.args.amount)),
      blockNumber: e.blockNumber,
      timestamp: block.timestamp,
    };
  }));

  return txs;
};

/**
 * Admin phân phối ETH từ contract
 */
export const distributeRewardOnChain = async (to, amountEth) => {
  if (!ethers.isAddress(to)) throw new Error("Địa chỉ nhận không hợp lệ");

  // Kiểm tra số dư contract
  const contractBalance = await provider.getBalance(leaderboardContract.address);
  if (parseFloat(ethers.formatEther(contractBalance)) < amountEth) {
    throw new Error("Contract không đủ ETH để phân phối");
  }

  const tx = await leaderboardContract.connect(adminWallet).distribute(
    to,
    ethers.parseEther(amountEth.toString())
  );

  const receipt = await tx.wait();
  return {
    to,
    amount: amountEth,
    txHash: tx.hash,
    blockNumber: receipt.blockNumber,
  };
};