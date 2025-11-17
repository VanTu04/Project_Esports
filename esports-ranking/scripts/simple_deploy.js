import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config(); 

async function main() {
  const rpcUrl = process.env.RPC_URL;
  const privateKey = process.env.ADMIN_PRIVATE_KEY;
  const abiPath = path.resolve("./artifacts/contracts/Leaderboard.sol/Leaderboard.json");

  if (!rpcUrl || !privateKey) throw new Error("Kiểm tra .env");
  if (!fs.existsSync(abiPath)) throw new Error("Chưa compile code!");

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log(`Đang deploy từ ví: ${wallet.address}`);

  const { abi, bytecode } = JSON.parse(fs.readFileSync(abiPath, "utf8"));
  const Factory = new ethers.ContractFactory(abi, bytecode, wallet);

  console.log("Đang gửi giao dịch deploy...");
  
  // --- FIX LỖI TẠI ĐÂY ---
  // Truyền tham số signerWallet vào constructor
  const contract = await Factory.deploy(wallet.address); 
  // -----------------------

  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("===================================");
  console.log("DEPLOY THÀNH CÔNG!");
  console.log("Địa chỉ Contract:", address);
  console.log("Signer Wallet set to:", wallet.address);
  console.log("===================================");
}

main().catch(console.error);