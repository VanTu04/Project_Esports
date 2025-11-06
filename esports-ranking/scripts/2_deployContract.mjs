import fs from "fs";
import path from "path";
import hre from "hardhat";

async function main() {
  const Esports = await hre.ethers.getContractFactory("EsportsRanking");
  const esports = await Esports.deploy();
  await esports.deployed();
  console.log("EsportsRanking deployed to:", esports.address);

  // save address
  const out = { address: esports.address, deployedAt: new Date().toISOString() };
  fs.writeFileSync(path.join(process.cwd(), "deployed-contract.json"), JSON.stringify(out, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});