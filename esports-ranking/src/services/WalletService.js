import fs from "fs";
import path from "path";
import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();
const walletsFile = path.resolve("src/data/wallets.json");
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

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
};