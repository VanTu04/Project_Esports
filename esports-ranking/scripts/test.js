import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();

const rpcUrl = process.env.RPC_URL;
const privateKey = process.env.ADMIN_PRIVATE_KEY;

if (!rpcUrl || !privateKey) throw new Error("Missing RPC_URL or ADMIN_PRIVATE_KEY");

const provider = new ethers.JsonRpcProvider(rpcUrl);
const wallet = new ethers.Wallet(privateKey, provider);

async function sendEth(toAddress, amountEth) {
  const balance = await provider.getBalance(wallet.address);
  console.log("Sender:", wallet.address, "Balance:", ethers.formatEther(balance));

  if (balance < ethers.parseEther(amountEth.toString())) {
    throw new Error("Không đủ ETH để gửi");
  }

  const nonce = await provider.getTransactionCount(wallet.address);
  console.log("Nonce:", nonce);

  // Lấy gas
  const feeData = await provider.getFeeData();
  const gasPrice = feeData.gasPrice || ethers.parseUnits("1", "gwei"); // fallback

  const tx = {
    to: toAddress,
    value: ethers.parseEther(amountEth.toString()),
    nonce: nonce,
    gasLimit: 21000,
    gasPrice: gasPrice
  };

  const txHash = "0xe149fc888af2f30e1deb068eb263e049d329c4c8ab211439ddc5ba0539c00b3f";
const tx1 = await provider.getTransaction(txHash);
console.log(tx1);

const receipt1 = await provider.getTransactionReceipt(txHash);
console.log(receipt1);

  console.log("Sending tx:", tx);

  const sentTx = await wallet.sendTransaction(tx);
  console.log("Transaction sent, hash:", sentTx.hash);

  const receipt = await sentTx.wait();
  console.log("Transaction mined, status:", receipt.status);
  return receipt;
}

// Example call
(async () => {
  try {
    const receipt = await sendEth("0xe2C8d55879ADB8967A1b18d1467b12f64823fE44", "1324");
    console.log("Tx mined:", receipt.transactionHash);
  } catch (err) {
    console.error(err);
  }
})();
