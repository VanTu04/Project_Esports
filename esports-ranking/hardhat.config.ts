import { defineConfig, configVariable } from "hardhat/config";
import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  plugins: [hardhatToolboxMochaEthersPlugin],

  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },

  networks: {
    hardhat: {
      type: "edr-simulated",
      allowUnlimitedContractSize: true,
      chainId: 31337,
      accounts: {
        accountsBalance: "1000000000000000000000000000000", // 1 million ETH
      },
    },
    sepolia: {
      type: "http",
      chainType: "l1",
      url: process.env.SEPOLIA_RPC_URL || configVariable("SEPOLIA_RPC_URL"),
      accounts: [
        process.env.SEPOLIA_PRIVATE_KEY || configVariable("SEPOLIA_PRIVATE_KEY"),
      ],
    },
  },
});
