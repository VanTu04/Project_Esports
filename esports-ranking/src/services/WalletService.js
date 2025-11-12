import fs from "fs";
import path from "path";
import { ethers } from "ethers";

const walletsFile = path.resolve("src/data/wallets.json");

function initFile() {
  if (!fs.existsSync(walletsFile)) {
    fs.mkdirSync(path.dirname(walletsFile), { recursive: true });
    fs.writeFileSync(walletsFile, JSON.stringify({ admin: null, teams: [] }, null, 2));
  }
}

function readWallets() {
  initFile();
  return JSON.parse(fs.readFileSync(walletsFile));
}

function writeWallets(data) {
  fs.writeFileSync(walletsFile, JSON.stringify(data, null, 2));
}

// tạo hoặc lấy ví admin
export function getAdminWallet() {
  const data = readWallets();
  if (!data.admin) {
    const wallet = ethers.Wallet.createRandom();
    data.admin = { address: wallet.address, privateKey: wallet.privateKey };
    writeWallets(data);
    console.log("Admin wallet created:", wallet.address);
    return wallet;
  }
  return new ethers.Wallet(data.admin.privateKey);
}

// tạo ví mới cho team
export function createTeamWallet(teamName) {
  const data = readWallets();
  if (data.teams.some(t => t.name === teamName)) {
    console.log(`Team ${teamName} already exists`);
    return data.teams.find(t => t.name === teamName);
  }
  const wallet = ethers.Wallet.createRandom();
  const newTeam = { name: teamName, address: wallet.address, privateKey: wallet.privateKey };
  data.teams.push(newTeam);
  writeWallets(data);
  console.log(`Created wallet for team ${teamName}: ${wallet.address}`);
  return newTeam;
}

// lấy danh sách các team
export function listTeams() {
  return readWallets().teams;
}
