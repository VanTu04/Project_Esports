import { ethers } from "ethers";
import crypto from "crypto";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32 bytes key từ .env
const IV_LENGTH = 16;

/**
 * Mã hóa text (ví dụ private key)
 */
export const encrypt = (text) => {
  const key = Buffer.from(process.env.ENCRYPT_KEY, "hex");
  const iv = Buffer.from(process.env.ENCRYPT_IV, "hex");

  if (key.length !== 32 || iv.length !== 16) {
    throw new Error(`Invalid key or IV length. Key: ${key.length}, IV: ${iv.length}`);
  }

  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
};

/**
 * Giải mã text đã mã hóa
 */
export const decrypt = (encrypted) => {
  const key = Buffer.from(process.env.ENCRYPT_KEY, "hex");
  const iv = Buffer.from(process.env.ENCRYPT_IV, "hex");

  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};

/**
 * Tạo ví Ethereum ngẫu nhiên
 */
export const generateWallet = () => {
  const wallet = ethers.Wallet.createRandom();
  return {
    address: wallet.address,
    privateKey: encrypt(wallet.privateKey) // lưu luôn encrypted
  };
};

/**
 * Tạo ví admin từ private key có sẵn trong .env
 */
export const getAdminWallet = () => {
  const privateKey = process.env.ADMIN_PRIVATE_KEY;
  if (!privateKey) throw new Error("Missing ADMIN_PRIVATE_KEY in .env");
  const wallet = new ethers.Wallet(privateKey);
  return {
    address: wallet.address,
    privateKey: encrypt(wallet.privateKey) // trả về encrypted luôn
  };
};

/**
 * Tạo ethers.Wallet từ private key đã mã hóa
 */
export const walletFromEncrypted = (encryptedPrivateKey, provider) => {
  const decryptedPK = decrypt(encryptedPrivateKey);
  return new ethers.Wallet(decryptedPK, provider);
};
