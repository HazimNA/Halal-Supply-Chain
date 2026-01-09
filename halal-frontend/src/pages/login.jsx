import React from 'react';
import { connectBlockchain } from "../blockchain/shared";

export default function Login({ setRole }) {
  const handleLogin = async () => {
    try {
      const { contract, address } = await connectBlockchain();
      const userAddr = address.toLowerCase(); // Standardize address

      // Automatic Role Detection
      const adminAddr = await contract.admin();
      const isAdmin = adminAddr.toLowerCase() === userAddr;
      
      const isProducer = await contract.isProducer(userAddr);
      const isSlaughter = await contract.isSlaughterhouse(userAddr);
      const isAuthority = await contract.isHalalAuthority(userAddr);
      const isDistributor = await contract.isDistributor(userAddr);
      const isRetailer = await contract.isRetailer(userAddr);

      if (isAdmin) setRole("ADMIN");
      else if (isProducer) setRole("PRODUCER");
      else if (isSlaughter) setRole("SLAUGHTERHOUSE");
      else if (isAuthority) setRole("AUTHORITY");
      else if (isDistributor) setRole("DISTRIBUTOR");
      else if (isRetailer) setRole("RETAILER");
      else setRole("PUBLIC");
    } catch (err) {
      console.error(err);
      alert("Please ensure MetaMask is connected to Localhost 8545.");
    }
  };

  return (
    <div className="login-container"> {/* Ensure centered container exists in CSS */}
      <div className="glass-card">
        <h1 className="card-title">HalalChain</h1>
        <p className="card-subtitle">Secure Blockchain Halal Supply Chain</p>
        <div className="action-stack">
          <button className="primary-btn" onClick={handleLogin}>Connect MetaMask</button>
          <button className="secondary-btn" onClick={() => setRole("PUBLIC")}>Enter as Guest</button>
        </div>
        <div className="status-footer"><span className="dot"></span> Localhost Active</div>
      </div>
    </div>
  );
}