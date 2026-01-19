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

  // 4. Verify the contract on Etherscan (if on a network that supports it)
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("Waiting for block confirmations...");
    await contract.deploymentTransaction().wait(6); // Wait for 6 confirmations

    console.log("Verifying contract...");
    try {
      await hre.run("verify:verify", {
        address: address,
        constructorArguments: [],
      });
      console.log("Contract verified successfully!");
    } catch (error) {
      console.log("Verification failed:", error.message);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});