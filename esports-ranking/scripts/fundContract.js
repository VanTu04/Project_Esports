// Script nạp tiền vào contract để phân phối rewards
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const rpcUrl = process.env.RPC_URL;
const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY;
const contractAddress = process.env.LEADERBOARD_CONTRACT_ADDRESS;

async function fundContract() {
  try {
    // Kết nối
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const adminWallet = new ethers.Wallet(adminPrivateKey, provider);

    console.log("🔗 Kết nối với contract:", contractAddress);
    console.log("👤 Admin wallet:", adminWallet.address);

    // Kiểm tra số dư admin
    const adminBalance = await provider.getBalance(adminWallet.address);
    console.log("💰 Số dư admin:", ethers.formatEther(adminBalance), "ETH");

    // Kiểm tra số dư contract hiện tại
    const contractBalance = await provider.getBalance(contractAddress);
    console.log("📦 Số dư contract hiện tại:", ethers.formatEther(contractBalance), "ETH");

    // Số tiền muốn nạp (ví dụ: 10 ETH)
    const amountToFund = "10";
    
    if (parseFloat(ethers.formatEther(adminBalance)) < parseFloat(amountToFund)) {
      console.error("❌ Admin không đủ ETH để nạp!");
      return;
    }

    console.log(`\n💸 Đang nạp ${amountToFund} ETH vào contract...`);

    // Gửi ETH vào contract
    const tx = await adminWallet.sendTransaction({
      to: contractAddress,
      value: ethers.parseEther(amountToFund)
    });

    console.log("⏳ Đang chờ xác nhận transaction...");
    console.log("🔗 TX Hash:", tx.hash);

    const receipt = await tx.wait();
    console.log("✅ Transaction đã được xác nhận!");
    console.log("📦 Block number:", receipt.blockNumber);

    // Kiểm tra số dư contract sau khi nạp
    const newContractBalance = await provider.getBalance(contractAddress);
    console.log("\n🎉 Số dư contract sau khi nạp:", ethers.formatEther(newContractBalance), "ETH");

  } catch (error) {
    console.error("❌ Lỗi:", error.message);
  }
}

fundContract();
