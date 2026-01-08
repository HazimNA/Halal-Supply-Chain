import React from 'react';
import { connectBlockchain } from "../blockchain/shared";

export default function Login({ setRole }) {
  const handleLogin = async () => {
    try {
      const { contract, address } = await connectBlockchain();
      
      // Automatic Role Detection
      const isAdmin = await contract.admin() === address;
      const isProducer = await contract.isProducer(address);
      const isSlaughter = await contract.isSlaughterhouse(address);
      const isAuthority = await contract.isHalalAuthority(address);
      const isDistributor = await contract.isDistributor(address);
      const isRetailer = await contract.isRetailer(address);

      if (isAdmin) setRole("ADMIN");
      else if (isProducer) setRole("PRODUCER");
      else if (isSlaughter) setRole("SLAUGHTERHOUSE");
      else if (isAuthority) setRole("AUTHORITY");
      else if (isDistributor) setRole("DISTRIBUTOR");
      else if (isRetailer) setRole("RETAILER");
      else setRole("PUBLIC");
    } catch (err) {
      alert("Please ensure MetaMask is connected to Localhost 8545.");
    }
  };

  return (
    <div className="glass-card">
      <h1 className="card-title">HalalChain</h1>
      <p className="card-subtitle">Secure Blockchain Supply Chain</p>
      <div className="action-stack">
        <button className="primary-btn" onClick={handleLogin}>Connect MetaMask</button>
        <button className="secondary-btn" onClick={() => setRole("PUBLIC")}>Enter as Guest</button>
      </div>
      <div className="status-footer"><span className="dot"></span> Localhost Active</div>
    </div>
  );
}