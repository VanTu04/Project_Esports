import bcrypt from "bcrypt";
import models from "../models/index.js";
import { getAdminWallet } from "../utils/wallet.js";
import { ethers } from "ethers";

const rpcUrl = process.env.RPC_URL || "http://127.0.0.1:8545";
const provider = new ethers.JsonRpcProvider(rpcUrl);

/**
 * Hàm helper để "import và nạp tiền" vào Anvil/Hardhat
 * @param {string} walletAddress - Địa chỉ ví cần nạp
 * @param {string} amountEth - Số lượng ETH (dạng chuỗi)
 */
export const fundWalletOnAnvil = async (walletAddress, amountEth = "1000000000000") => {
  try {
    console.log(`[ANVIL SYNC] Nạp ${amountEth} ETH cho ví ${walletAddress}...`);
    await provider.send("hardhat_impersonateAccount", [walletAddress]);
    const hexBalance = "0x" + ethers.parseEther(amountEth).toString(16);
    await provider.send("hardhat_setBalance", [walletAddress, hexBalance]);
    const newBalance = await provider.getBalance(walletAddress);
    console.log(`[ANVIL SYNC] Thành công. Số dư mới: ${ethers.formatEther(newBalance)} ETH`);
  } catch (rpcErr) {
    console.warn(`[ANVIL WARN] Không thể nạp tiền cho ví ${walletAddress}: ${rpcErr.message}`);
  }
}

export const initAdminAccount = async () => {
  try {
    const adminUsername = process.env.ADMIN_USERNAME || "admin123";
    let adminUser = await models.User.findOne({ where: { username: adminUsername } });

    if (adminUser) {
      // 🔹 Nếu admin đã tồn tại → không nạp tiền, chỉ log
      console.log("Admin đã tồn tại:", adminUser.username);
      console.log("Ví admin:", adminUser.wallet_address);
      return adminUser;
    }

    // 🔹 Nếu admin chưa tồn tại → tạo mới
    console.log("Admin chưa tồn tại, đang khởi tạo...");
    const wallet = getAdminWallet();
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);

    adminUser = await models.User.create({
      username: adminUsername,
      full_name: "System Admin",
      email: process.env.ADMIN_EMAIL,
      password: hashedPassword,
      role: 4,
      status: 1,
      deleted: 0,
      created_by: null,
      wallet_address: wallet.address,
      private_key: wallet.privateKey,
    });

    console.log(" Admin khởi tạo thành công:", adminUser.username);
    console.log(" Ví admin:", wallet.address);

    // 🔹 Nạp tiền chỉ khi admin mới được tạo
    const adminBalance = "1000000000000000"; // 1 quadrillion ETH
    await fundWalletOnAnvil(wallet.address, adminBalance);

    return adminUser;
  } catch (err) {
    console.error("initAdminAccount error:", err);
  }
};
