import { ethers } from "ethers";
import { getWalletFromDB, getAllTeamWallets } from "../src/services/UserService.js";
import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";

dotenv.config();

async function startFullNode() {
  const rpcUrl = process.env.RPC_URL || "http://127.0.0.1:8545";
  console.log("Setting up Hardhat local network...");

  try {
    // Lấy admin và team wallets từ DB
    const admin = await getWalletFromDB(process.env.ADMIN_USERNAME);
    const teams = await getAllTeamWallets();
    const allWallets = [admin, ...teams];

    console.log(`Found ${allWallets.length} wallets to setup`);

    // Tạo provider với ethers v6
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    console.log("Provider connected to", rpcUrl);

    // Step 1: Impersonate tất cả các addresses
    console.log("\nStep 1: Impersonating accounts...");
    for (const wallet of allWallets) {
      await provider.send("hardhat_impersonateAccount", [wallet.address]);
      console.log(`  ✓ Impersonated: ${wallet.address}`);
    }

    // Step 2: Set balance cho tất cả addresses
    console.log("\nStep 2: Funding accounts...");
    const hexBalance = "0x" + ethers.parseEther("1000000000000").toString(16); // 1 trillion ETH
    for (const wallet of allWallets) {
      await provider.send("hardhat_setBalance", [wallet.address, hexBalance]);
      const balance = await provider.getBalance(wallet.address);
      console.log(`Funded ${wallet.address}: ${ethers.formatEther(balance)} ETH`);
    }

    // Step 3: Deploy contract bằng admin wallet
    console.log("\nStep 3: Deploying Leaderboard contract...");

    // Đọc artifact JSON
    const artifactPath = path.resolve(
      "./artifacts/contracts/Leaderboard.sol/Leaderboard.json"
    );
    const artifactRaw = await fs.readFile(artifactPath, "utf8");
    const LeaderboardArtifact = JSON.parse(artifactRaw);

    const adminSigner = new ethers.Wallet(admin.privateKey, provider);

    const LeaderboardFactory = new ethers.ContractFactory(
      LeaderboardArtifact.abi,
      LeaderboardArtifact.bytecode,
      adminSigner
    );

    const leaderboard = await LeaderboardFactory.deploy();
    await leaderboard.waitForDeployment();
    const contractAddress = await leaderboard.getAddress();
    console.log(`Leaderboard deployed at: ${contractAddress}`);

    // In ra thông tin để import vào MetaMask
    console.log("\n" + "=".repeat(80));
    console.log("SETUP COMPLETED!");
    console.log("=".repeat(80));
    console.log("\nMetaMask Configuration:");
    console.log(`   Network Name: Hardhat Local`);
    console.log(`   RPC URL: ${rpcUrl}`);
    console.log(`   Chain ID: 31337`);
    console.log(`   Currency Symbol: ETH`);

    console.log("\nAccounts to Import (copy private keys):");
    console.log("-".repeat(80));
    allWallets.forEach((wallet, index) => {
      console.log(`\n${index === 0 ? 'ADMIN' : `TEAM ${index}`}:`);
      console.log(`   Address: ${wallet.address}`);
      console.log(`   Private Key: ${wallet.privateKey}`);
      console.log(`   Balance: 100 ETH`);
    });
    console.log("=".repeat(80));

    // Lưu thông tin deployment ra file
    const deploymentData = {
      leaderboard: contractAddress,
      network: "localhost",
      rpcUrl,
      chainId: 31337,
      accounts: allWallets.map(w => ({
        address: w.address,
        role: w.address === admin.address ? "admin" : "team"
      })),
      deployedAt: new Date().toISOString()
    };
    await fs.writeFile("./deployments.json", JSON.stringify(deploymentData, null, 2));
    console.log("Contract address saved to deployments.json\n");

    return {
      contractAddress,
      accounts: allWallets.length
    };

  } catch (error) {
    console.error("Error:", error.message);
    console.error(error.stack);
    throw error;
  }
}

// Chạy script
startFullNode()
  .then(result => {
    console.log("Script completed successfully");
    console.log(`   Contract: ${result.contractAddress}`);
    console.log(`   Accounts setup: ${result.accounts}`);
  })
  .catch(error => {
    console.error("Script failed:", error);
    process.exit(1);
  });
