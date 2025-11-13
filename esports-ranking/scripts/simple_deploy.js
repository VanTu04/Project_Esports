// File: simple_deploy.js
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Đảm bảo file .env của bạn có RPC_URL và ADMIN_PRIVATE_KEY
dotenv.config(); 

async function main() {
  const rpcUrl = process.env.RPC_URL;
  const privateKey = process.env.ADMIN_PRIVATE_KEY;

  // Đường dẫn đến file ABI/Bytecode
  const abiPath = path.resolve("./artifacts/contracts/Leaderboard.sol/Leaderboard.json");

  if (!rpcUrl || !privateKey) {
    throw new Error("Vui lòng kiểm tra RPC_URL và ADMIN_PRIVATE_KEY trong .env");
  }
  if (!fs.existsSync(abiPath)) {
    throw new Error("Không tìm thấy file Artifact. Bạn đã chạy 'npx hardhat compile' chưa?");
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log(`Đang deploy từ ví: ${wallet.address}`);

  const { abi, bytecode } = JSON.parse(fs.readFileSync(abiPath, "utf8"));

  const Factory = new ethers.ContractFactory(abi, bytecode, wallet);

  console.log("Đang gửi giao dịch deploy...");
  const contract = await Factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("===================================");
  console.log("DEPLOY THÀNH CÔNG!");
  console.log("Địa chỉ Contract:", address);
  console.log("===================================");
}

main().catch(console.error);