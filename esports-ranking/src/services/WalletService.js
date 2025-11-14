import fs from "fs";
import path from "path";
import { ethers } from "ethers";
import dotenv from "dotenv";
import { leaderboardContract } from "../init/blockchain.js";
import models from "../models/index.js";
dotenv.config();
const walletsFile = path.resolve("src/data/wallets.json");
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const privateKey = process.env.ADMIN_PRIVATE_KEY;
const wallet = new ethers.Wallet(privateKey, provider);
import * as blockService from "./BlockchainService.js";

async function sendEthWithNonce(toAddress, amountEth, nonce) {
  const tx = {
    to: toAddress,
    value: ethers.parseEther(amountEth.toString()),
    nonce: nonce,
    gasLimit: 21000,
    gasPrice: (await provider.getFeeData()).gasPrice || ethers.parseUnits("1", "gwei")
  };

  const sentTx = await wallet.sendTransaction(tx);
  const receipt = await sentTx.wait();
  return receipt;
}

// Hàm phân phối rewards song song
export async function distributeRewardsTournament(idTournament) {
  // 1️⃣ Lấy reward từ DB
  console.log("Distributing rewards for tournament:", idTournament);
  const rewards = await models.TournamentReward.findAll({
    where: { tournament_id: idTournament },
    order: [['rank', 'ASC']]
  });

  if (!rewards.length) throw new Error("No rewards found for tournament");

  // 2️⃣ Lấy leaderboard từ blockchain
  const leaderboard = await blockService.getLeaderboardFromChain(idTournament, 999); // round cuối

  console.log("Leaderboard:", leaderboard);
  // 3️⃣ Ghép rank -> reward
  const winners = leaderboard
    .sort((a,b) => b.score - a.score)
    .slice(0, rewards.length)
    .map((player, index) => ({
      ...player,
      reward: rewards[index].reward_amount
    }));

  console.log("Rewards db:", rewards.map(r => r.reward_amount));
  console.log("Rewards:", rewards.map(r => r.reward_amount));
  console.log("Leaderboard:", leaderboard.map(p => p.username));


  // 4️⃣ Gửi ETH song song
  let nonce = await provider.getTransactionCount(wallet.address);
  const promises = winners.map(winner => {
    const currentNonce = nonce++;
    return sendEthWithNonce(winner.wallet, winner.reward, currentNonce)
      .then(receipt => ({
        user: winner.username,
        wallet: winner.wallet,
        reward: winner.reward,
        txHash: receipt.transactionHash,
        status: receipt.status
      }))
      .catch(err => ({
        user: winner.username,
        wallet: winner.wallet,
        reward: winner.reward,
        error: err.message
      }));
  });

  const results = await Promise.all(promises);
  return results;
}

function initFile() {
  if (!fs.existsSync(walletsFile)) {
    fs.mkdirSync(path.dirname(walletsFile), { recursive: true });
    fs.writeFileSync(walletsFile, JSON.stringify({ admin: null, teams: [] }, null, 2));
  }
}

function readWallets() {
  initFile();
  return JSON.parse(fs.readFileSync(walletsFile));
}

function writeWallets(data) {
  fs.writeFileSync(walletsFile, JSON.stringify(data, null, 2));
}

// tạo hoặc lấy ví admin
export function getAdminWallet() {
  const data = readWallets();
  if (!data.admin) {
    const wallet = ethers.Wallet.createRandom();
    data.admin = { address: wallet.address, privateKey: wallet.privateKey };
    writeWallets(data);
    console.log("Admin wallet created:", wallet.address);
    return wallet;
  }
  return new ethers.Wallet(data.admin.privateKey);
}

// tạo ví mới cho team
export function createTeamWallet(teamName) {
  const data = readWallets();
  if (data.teams.some(t => t.name === teamName)) {
    console.log(`Team ${teamName} already exists`);
    return data.teams.find(t => t.name === teamName);
  }
  const wallet = ethers.Wallet.createRandom();
  const newTeam = { name: teamName, address: wallet.address, privateKey: wallet.privateKey };
  data.teams.push(newTeam);
  writeWallets(data);
  console.log(`Created wallet for team ${teamName}: ${wallet.address}`);
  return newTeam;
}

// lấy danh sách các team
export function listTeams() {
  return readWallets().teams;
}

/**
 * 🔹 Lấy số dư (ETH) của 1 địa chỉ ví
 * @param {string} address - Địa chỉ ví Ethereum
 * @returns {Promise<{address: string, balanceEth: string}>}
 */
export const getWalletBalance = async (address) => {
  if (!ethers.isAddress(address)) {
    throw new Error("Địa chỉ ví không hợp lệ");
  }

  // Lấy số dư tính bằng Wei → chuyển sang ETH
  const balanceWei = await provider.getBalance(address);
  const balanceEth = ethers.formatEther(balanceWei);

  return { address, balanceEth };
};

/**
 * Lấy danh sách giao dịch (gửi/nhận) của ví
 * @param {string} address - Địa chỉ ví Ethereum
 * @param {number} [startBlock=0] - Block bắt đầu (mặc định 0)
 * @param {number|string} [endBlock="latest"] - Block kết thúc (mặc định là block mới nhất)
 * @returns {Promise<Array>} Danh sách giao dịch
 */
export const getWalletTransactions = async (
  address,
  startBlock = 0,
  endBlock = "latest"
) => {
  if (!ethers.isAddress(address)) {
    throw new Error("Địa chỉ ví không hợp lệ");
  }

  const latest =
    endBlock === "latest" ? await provider.getBlockNumber() : endBlock;

  const transactions = [];

  console.log(`[WalletService] Quét từ block ${startBlock} → ${latest}`);

  for (let i = startBlock; i <= latest; i++) {
    const block = await provider.getBlock(i, true); // true => lấy full transactions
    if (!block?.transactions) continue;

    for (const tx of block.transactions) {
      if (
        tx.from?.toLowerCase() === address.toLowerCase() ||
        tx.to?.toLowerCase() === address.toLowerCase()
      ) {
        transactions.push({
          hash: tx.hash,
          from: tx.from,
          to: tx.to,
          value: ethers.formatEther(tx.value),
          blockNumber: tx.blockNumber,
        });
      }
    }
  }

  // Sắp xếp giảm dần theo block mới nhất
  return transactions.reverse();
}

/**
 * Lấy leaderboard JSON từ contract
 */
export const getLeaderboardFromChain = async (tournamentId, roundNumber) => {
  const jsonData = await leaderboardContract.getLeaderboardJSON(tournamentId, roundNumber);
  return JSON.parse(jsonData);
};

/**
 * Gửi ETH từ contract cho user
 */
export const distributeRewardOnChain = async (to, amountEth) => {
  if (!ethers.isAddress(to)) throw new Error("Địa chỉ nhận không hợp lệ");

  // Check balance contract
  const contractBalance = await provider.getBalance(leaderboardContract.address);
  if (parseFloat(ethers.formatEther(contractBalance)) < amountEth) {
    throw new Error("Contract không đủ ETH để phân phối");
  }

  const tx = await leaderboardContract.connect(signer).distribute(
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

export const distributeTournamentRewards = async (tournamentId) => {
  // 1️⃣ Lấy reward tiers từ DB
  const rewards = await models.TournamentReward.findAll({
    where: { tournament_id: tournamentId },
    order: [["rank", "ASC"]],
    raw: true,
  });

  if (!rewards || rewards.length === 0) throw new Error("Không có reward tiers để chia");

  // 2️⃣ Lấy leaderboard từ blockchain
  const leaderboard = await blockService.getLeaderboardFromChain(tournamentId, 999); // round cuối
  if (!leaderboard || leaderboard.length === 0) throw new Error("Leaderboard trống");

  const results = [];

  // 3️⃣ Lặp qua reward tiers → match với leaderboard
  for (const reward of rewards) {
    const player = leaderboard[reward.rank - 1]; // top 1 = index 0
    if (!player || !player.wallet) continue;

    // 4️⃣ Gửi ETH
    const tx = await distributeRewardOnChain(player.wallet, reward.reward_amount);

    results.push({
      rank: reward.rank,
      userId: player.userId,
      username: player.username,
      wallet: player.wallet,
      reward_amount: reward.reward_amount,
      txHash: tx.txHash,
      blockNumber: tx.blockNumber,
    });
  }

  return results;
};