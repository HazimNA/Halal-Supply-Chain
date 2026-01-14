import { ethers } from "ethers";
import { HalalSupplyChainABI } from "../abi/HalalSupplyChainABI.js";

// The ABI file exports an artifact-like object with an `abi` property.
const CONTRACT_ABI = HalalSupplyChainABI?.abi ?? HalalSupplyChainABI;

export const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

/** Choose a browser/provider compatible with ethers v5 or v6 */
function makeBrowserProvider() {
  if (typeof ethers.BrowserProvider !== "undefined") {
    return new ethers.BrowserProvider(window.ethereum); // ethers v6
  }
  if (ethers.providers && ethers.providers.Web3Provider) {
    return new ethers.providers.Web3Provider(window.ethereum); // ethers v5
  }
  throw new Error("Unsupported ethers version");
}

/** Choose a JSON-RPC provider for guest mode (v5/v6) */
function makeJsonRpcProvider(rpc = "http://127.0.0.1:8545") {
  if (typeof ethers.JsonRpcProvider !== "undefined") {
    return new ethers.JsonRpcProvider(rpc); // v6
  }
  if (ethers.providers && ethers.providers.JsonRpcProvider) {
    return new ethers.providers.JsonRpcProvider(rpc); // v5
  }
  throw new Error("Unsupported ethers version for JSON-RPC");
}

/**
 * Connects to browser wallet and returns:
 * - contract: provider-backed contract (safe for read/call)
 * - signer: signer/account for sending txs (may be null)
 * - contractWithSigner: contract connected to signer (for writes) or null
 * - address: selected account address
 */
export const connectBlockchain = async () => {
  if (!window.ethereum) {
    alert("MetaMask not detected! Please install the extension.");
    throw new Error("MetaMask not found");
  }

  try {
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts available");
    }

    const provider = makeBrowserProvider();

  // AWAIT the signer here!
  const signer = await provider.getSigner(); 

  // Connect the contract to the resolved signer
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  const contractWithSigner = contract.connect(signer);

  return { contract, signer, contractWithSigner, address: accounts[0] };
  } catch (err) {
    console.error("Blockchain Connection Error:", err);

    if (err && err.code === 4001) {
      alert("Connection rejected. Please approve the MetaMask popup.");
    } else if (err && err.code === -32002) {
      alert("Request already pending. Open MetaMask to confirm.");
    } else if (err && /no accounts/i.test(String(err.message || err))) {
      alert("No unlocked accounts found. Please unlock MetaMask.");
    } else {
      alert("Error accessing blockchain. Is your Hardhat node running?");
    }

    throw err;
  }
};

export async function getGuestContract() {
  try {
    const provider = makeJsonRpcProvider("http://127.0.0.1:8545");
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  } catch (err) {
    console.error("Guest mode failed:", err);
    return null;
  }
}