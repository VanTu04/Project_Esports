// blockchain.js
import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const rpcUrl = process.env.RPC_URL;
const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY;
const contractAddress = process.env.LEADERBOARD_CONTRACT_ADDRESS;

if (!rpcUrl || !adminPrivateKey || !contractAddress) {
  throw new Error("Missing RPC_URL, ADMIN_PRIVATE_KEY or LEADERBOARD_CONTRACT_ADDRESS");
}

// === Provider (singleton) ===
const provider = new ethers.JsonRpcProvider(rpcUrl);

// === Wallet admin (singleton) ===
const adminWallet = new ethers.Wallet(adminPrivateKey, provider);

// === Load ABI ===
const abiPath = path.resolve('./artifacts/contracts/Leaderboard.sol/Leaderboard.json');
if (!fs.existsSync(abiPath)) {
  throw new Error(`Cannot find ABI file at ${abiPath}. Compile your contracts first.`);
}
const abiFile = fs.readFileSync(abiPath, 'utf8');
const { abi } = JSON.parse(abiFile);

// === Contract instance (singleton) ===
const leaderboardContract = new ethers.Contract(contractAddress, abi, adminWallet);

export { provider, adminWallet, leaderboardContract };
