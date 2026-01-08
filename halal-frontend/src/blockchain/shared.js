import { ethers } from "ethers";
import contractArtifact from "../contracts/HalalSupplyChain.json";

export const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

// For Admin, Producers, Authorities (Requires MetaMask)
export async function connectBlockchain() {
  if (!window.ethereum) throw new Error("Please install MetaMask");
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const contract = new ethers.Contract(CONTRACT_ADDRESS, contractArtifact.abi, signer);
  const address = await signer.getAddress();
  return { provider, signer, contract, address };
}

// For Guest Mode (No MetaMask/Wallet needed)
export async function getGuestContract() {
  // Connects directly to the Hardhat node via JSON-RPC
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  return new ethers.Contract(CONTRACT_ADDRESS, contractArtifact.abi, provider);
}