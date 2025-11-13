// File: services/blockchain.service.js
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

// --- 1. Lấy thông tin từ .env ---
const rpcUrl = process.env.RPC_URL;
const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY;
const contractAddress = process.env.LEADERBOARD_CONTRACT_ADDRESS;

if (!rpcUrl || !adminPrivateKey || !contractAddress) {
  console.error("FATAL ERROR: Vui lòng kiểm tra RPC_URL, ADMIN_PRIVATE_KEY, và LEADERBOARD_CONTRACT_ADDRESS trong file .env");
  // (Trong thực tế, bạn nên 'throw new Error' để dừng app)
}

// --- 2. Khởi tạo Ethers ---
const provider = new ethers.JsonRpcProvider(rpcUrl);
// 'adminWallet' là "Signer" (Người ký), có quyền gửi giao dịch
const adminWallet = new ethers.Wallet(adminPrivateKey, provider);

// --- 3. Đọc ABI của Contract ---
let leaderboardContract;
try {
  const abiPath = path.resolve('./artifacts/contracts/Leaderboard.sol/Leaderboard.json');
  const abiFile = fs.readFileSync(abiPath, 'utf8');
  const { abi } = JSON.parse(abiFile);

  // Tạo instance của contract, liên kết với ví Admin (để ký)
  leaderboardContract = new ethers.Contract(contractAddress, abi, adminWallet);

  console.log(`[Blockchain Service] Đã kết nối Contract Leaderboard tại ${contractAddress}`);
} catch (error) {
  console.error(`[Blockchain Service] Lỗi khi đọc ABI hoặc khởi tạo contract: ${error.message}`);
  // Dừng app nếu không thể tải contract
  process.exit(1); 
}


/**
 * Cập nhật điểm (GHI) lên Smart Contract
 * @param {string} wallet_address - Ví của đội (team)
 * @param {number} pointsToAdd - Số điểm CỘNG THÊM (ví dụ 1 hoặc 2)
 */
export const updateScoreOnContract = async (wallet_address, pointsToAdd) => {
  if (!wallet_address || pointsToAdd == null) {
    throw new Error("wallet_address và pointsToAdd là bắt buộc.");
  }

  console.log(`[BLOCKCHAIN_SERVICE] Đang chuẩn bị GHI...`);
  console.log(`[BLOCKCHAIN_SERVICE]   - Gọi hàm: addPoints(${wallet_address}, ${pointsToAdd})`);

  try {
    // 1. Gửi giao dịch (Transaction)
    // (Giả sử hàm trong contract của bạn tên là 'addPoints')
    const tx = await leaderboardContract.addPoints(wallet_address, pointsToAdd);
    
    console.log(`[BLOCKCHAIN_SERVICE]   - Đã gửi TX, hash: ${tx.hash}. Đang chờ xác nhận...`);

    // 2. Chờ 1 block xác nhận (rất nhanh trên Anvil)
    // 'tx.wait(1)' là bắt buộc để đảm bảo giao dịch đã hoàn thành
    const receipt = await tx.wait(1); 

    console.log(`[BLOCKCHAIN_SERVICE]   - Giao dịch THÀNH CÔNG, block: ${receipt.blockNumber}`);
    
    return {
      success: true,
      hash: tx.hash,
      blockNumber: receipt.blockNumber
    };

  } catch (error) {
    console.error(`[BLOCKCHAIN_SERVICE] Lỗi khi GHI on-chain:`, error.message);
    // (Lỗi có thể do: Hết gas, Admin không phải 'owner', ...)
    throw new Error('Giao dịch Blockchain thất bại: ' + error.message);
  }
};

export const getScoreFromContract = async (wallet_address) => {
  try {
    // (GiBả sử hàm đọc tên là 'getScore')
    const score = await leaderboardContract.getScore(wallet_address);
    // Ethers v6 trả về BigInt, cần chuyển đổi
    return Number(score); 
  } catch (error) {
    console.error(`[Blockchain Service] Lỗi khi ĐỌC on-chain:`, error.message);
    return 0; // Trả về 0 nếu có lỗi
  }
};