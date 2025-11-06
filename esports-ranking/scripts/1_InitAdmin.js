// scripts/1_initAdmin.js - Tạo admin account một lần duy nhất
const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("\n INITIALIZING ADMIN ACCOUNT\n");
  console.log("=".repeat(60));

  // Kiểm tra xem admin đã tồn tại chưa
  const adminFilePath = path.join(__dirname, '../admin-config.json');
  
  if (fs.existsSync(adminFilePath)) {
    console.log(" Admin account already exists!");
    const existingAdmin = JSON.parse(fs.readFileSync(adminFilePath, 'utf8'));
    console.log("\n Existing Admin Info:");
    console.log("Address:", existingAdmin.address);
    console.log("Created:", existingAdmin.createdAt);
    
    const choice = await new Promise((resolve) => {
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      readline.question("\nDo you want to create a NEW admin? (yes/no): ", (answer) => {
        readline.close();
        resolve(answer);
      });
    });
    
    if (choice.toLowerCase() !== 'yes') {
      console.log("\nUsing existing admin account.");
      return;
    }
    
    console.log("\n  WARNING: Creating new admin will require redeploying the contract!");
  }

  // Tạo admin wallet mới
  console.log("\n Generating new admin wallet...");
  const adminWallet = hre.ethers.Wallet.createRandom();

  console.log("\n Admin Account Created!");
  console.log("─".repeat(60));
  console.log("Address:      ", adminWallet.address);
  console.log("Private Key:  ", adminWallet.privateKey);
  console.log("─".repeat(60));
  console.log("\n Seed Phrase (12 words) - KEEP THIS SAFE!");
  console.log("─".repeat(60));
  console.log(adminWallet.mnemonic.phrase);
  console.log("─".repeat(60));

  // Connect wallet với provider để có thể giao dịch
  const connectedWallet = adminWallet.connect(hre.ethers.provider);

  // Set balance cho admin (unlimited funds)
  await hre.network.provider.send("hardhat_setBalance", [
    adminWallet.address,
    "0xC9F2C9CD04674EDEA40000000", // 1 trillion ETH
  ]);

  const balance = await hre.ethers.provider.getBalance(adminWallet.address);
  console.log("\n Admin Balance:", hre.ethers.formatEther(balance), "ETH");

  // Lưu thông tin admin
  const adminConfig = {
    address: adminWallet.address,
    privateKey: adminWallet.privateKey,
    mnemonic: adminWallet.mnemonic.phrase,
    createdAt: new Date().toISOString(),
    balance: hre.ethers.formatEther(balance)
  };

  fs.writeFileSync(adminFilePath, JSON.stringify(adminConfig, null, 2));
  console.log("\n Admin config saved to admin-config.json");

  // Tạo file .env.example
  const envExample = `# Admin Private Key (for deployment)
ADMIN_PRIVATE_KEY=${adminWallet.privateKey}

# Network Configuration
HARDHAT_NETWORK=localhost
RPC_URL=http://127.0.0.1:8545
CHAIN_ID=31337
`;

  const envPath = path.join(__dirname, '../.env.example');
  fs.writeFileSync(envPath, envExample);
  console.log(" .env.example created");

  console.log("\n" + "=".repeat(60));
  console.log(" NEXT STEPS:");
  console.log("─".repeat(60));
  console.log("1. SAVE the seed phrase above in a SECURE place");
  console.log("2. Run: npx hardhat run scripts/2_deployContract.js --network localhost");
  console.log("3. Import admin to MetaMask using the private key above");
  console.log("─".repeat(60));
  
  console.log("\n IMPORT TO METAMASK:");
  console.log("─".repeat(60));
  console.log("MetaMask → Import Account → Private Key");
  console.log("Paste:", adminWallet.privateKey);
  console.log("─".repeat(60));

  console.log("\n SECURITY WARNINGS:");
  console.log("• This is a TEST account - NEVER use on mainnet");
  console.log("• Keep private key and seed phrase SECRET");
  console.log("• Add admin-config.json to .gitignore");
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });