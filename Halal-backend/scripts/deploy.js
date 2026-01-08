const hre = require("hardhat");

async function main() {
  console.log("Starting deployment...");

  // 1. Get the contract
  const HalalSupplyChain = await hre.ethers.getContractFactory("HalalSupplyChain");
  
  // 2. Deploy it
  const contract = await HalalSupplyChain.deploy();

  // 3. Wait for it to finish
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`HalalSupplyChain deployed to: ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});