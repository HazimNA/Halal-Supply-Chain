import React, { useState } from 'react';
import { connectBlockchain } from "../blockchain/shared";

export default function Login({ setRole }) {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const connection = await connectBlockchain();
      if (!connection) {
        setLoading(false);
        return;
      }

      const { contract, address } = connection;
      const userAddr = (address || "").toLowerCase();

      const [
        adminAddr,
        isProducer,
        isSlaughter,
        isAuthority,
        isDistributor,
        isRetailer
      ] = await Promise.all([
        contract.admin(),
        contract.isProducer(userAddr),
        contract.isSlaughterhouse(userAddr),
        contract.isHalalAuthority(userAddr),
        contract.isDistributor(userAddr),
        contract.isRetailer(userAddr),
      ]);

      if ((adminAddr || "").toLowerCase() === userAddr) setRole("ADMIN");
      else if (isProducer) setRole("PRODUCER");
      else if (isSlaughter) setRole("SLAUGHTERHOUSE");
      else if (isAuthority) setRole("AUTHORITY");
      else if (isDistributor) setRole("DISTRIBUTOR");
      else if (isRetailer) setRole("RETAILER");
      else {
        alert("Wallet connected, but no role assigned. Entering as Public.");
        setRole("PUBLIC");
      }
    } catch (err) {
      console.error("Login Error:", err);
      const msg = err?.message ?? String(err);
      if (msg.includes("User rejected") || msg.toLowerCase().includes("user rejected")) {
        alert("Connection refused. Please allow the MetaMask popup to login.");
      } else {
        alert("MetaMask Error: Please unlock your wallet or ensure Hardhat node is running at port 8545.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="glass-card">
        <h1 className="card-title">HalalChain</h1>
        <p className="card-subtitle">Secure Blockchain Halal Supply Chain</p>
        <div className="action-stack">
          <button 
            className="primary-btn" 
            onClick={handleLogin} 
            disabled={loading}
          >
            {loading ? "Waiting for MetaMask..." : "Connect MetaMask"}
          </button>
          
          <button 
            className="secondary-btn" 
            onClick={() => setRole("PUBLIC")}
            disabled={loading}
          >
            Enter as Guest
          </button>
        </div>
        <div className="status-footer">
          <span className={`dot ${loading ? 'syncing' : ''}`}></span> 
          {loading ? " Verifying Wallet..." : " Localhost Active"}
        </div>
      </div>
    </div>
  );
}