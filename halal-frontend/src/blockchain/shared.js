import { ethers } from "ethers";
import { HalalSupplyChainABI } from "../abi/HalalSupplyChainABI.js";

// The ABI file exports an artifact-like object with an `abi` property.
const CONTRACT_ABI = HalalSupplyChainABI?.abi ?? HalalSupplyChainABI;

// ✅ Use env contract address so you can switch networks easily
export const CONTRACT_ADDRESS =
  import.meta?.env?.VITE_CONTRACT_ADDRESS || "0x119Bf97AEc8f72Df116f6288e9c6f23Dd55e619f";

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
function makeJsonRpcProvider(rpc) {
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

    // Read contract with provider, write with signer
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
      alert("Error accessing blockchain. Check MetaMask network and RPC.");
    }

    throw err;
  }
};

// ✅ FIXED: Guest uses Sepolia HTTPS RPC (not localhost)
export async function getGuestContract() {
  try {
    const RPC_URL =
      import.meta?.env?.VITE_SEPOLIA_RPC_URL || "https://ethereum-sepolia.publicnode.com";

    const provider = makeJsonRpcProvider(RPC_URL);

    // quick sanity check (optional but helps detect RPC issues)
    await provider.getBlockNumber();

    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  } catch (err) {
    console.error("Guest mode failed:", err);
    throw err; // better to throw so Public page can show proper error
  }
}
  