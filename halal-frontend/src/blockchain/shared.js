import { ethers } from "ethers";
import contractArtifact from "../contracts/HalalSupplyChain.json";

export const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

// 2. This is the ABI extracted from the JSON 
const CONTRACT_ABI = [
  "constructor()",
  "event BatchCreated(uint256 batchId, string name, uint256 count, address producer)",
  "event BatchStatusUpdated(uint256 batchId, uint8 newStatus)",
  "event HalalCertificateSet(uint256 batchId, string certificateHash, bool isHalal)",
  "event OwnershipTransferred(uint256 batchId, address from, address to)",
  "event RoleGranted(address indexed account, string role)",
  "event SlaughterRecorded(uint256 batchId, bool isHalal)",
  "function admin() view returns (address)",
  "function createBatch(string name) returns (uint256)",
  "function getBatch(uint256 batchId) view returns (tuple(uint256 id, string name, uint256 nameCount, address currentOwner, uint8 status, string certificateHash))",
  "function getStatusHistory(uint256 batchId) view returns (tuple(uint8 newStatus, uint256 changedAt)[])",
  "function grantDistributorRole(address account)",
  "function grantHalalAuthorityRole(address account)",
  "function grantProducerRole(address account)",
  "function grantRetailerRole(address account)",
  "function grantSlaughterhouseRole(address account)",
  "function isDistributor(address) view returns (bool)",
  "function isHalalAuthority(address) view returns (bool)",
  "function isProducer(address) view returns (bool)",
  "function isRetailer(address) view returns (bool)",
  "function isSlaughterhouse(address) view returns (bool)",
  "function nameAndCountToId(string, uint256) view returns (uint256)",
  "function nameToCount(string) view returns (uint256)",
  "function recordSlaughter(uint256 batchId, bool isHalal)",
  "function setHalalCertificate(uint256 batchId, string hash, bool isH)",
  "function transferBatchOwnership(uint256 batchId, address newOwner)"
];

// For Admin, Producers, Authorities (Requires MetaMask)
export const connectBlockchain = async () => {
  if (!window.ethereum) throw new Error("MetaMask not found");

  // Trigger MetaMask popup
  const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
  
  let provider;
  // Support for ethers v5
  if (ethers.providers) {
    provider = new ethers.providers.Web3Provider(window.ethereum);
  } 
  // Support for ethers v6
  else {
    provider = new ethers.BrowserProvider(window.ethereum);
  }

  const signer = await provider.getSigner();
  
  // Replace with your actual deployment address and ABI
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

  return { contract, address: accounts[0] };
};

// For Guest Mode (No MetaMask/Wallet needed)
export async function getGuestContract() {
  // Connects directly to the Hardhat node via JSON-RPC
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  return new ethers.Contract(CONTRACT_ADDRESS, contractArtifact.abi, provider);
}