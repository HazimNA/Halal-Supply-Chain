import React, { useState } from 'react';
import { connectBlockchain } from "../blockchain/shared";

export default function Admin({ logout }) {
  const [targetAddress, setTargetAddress] = useState("");
  const [status, setStatus] = useState("");

  const handleGrantRole = async (roleType) => {
    if (!targetAddress) return alert("Please enter a wallet address");
    setStatus("Processing...");
    
    try {
      const { contract } = await connectBlockchain();
      let tx;

      // Logic: Match the function names exactly as they are in your Solidity contract
      if (roleType === 'producer') tx = await contract.grantProducerRole(targetAddress);
      else if (roleType === 'slaughter') tx = await contract.grantSlaughterhouseRole(targetAddress);
      else if (roleType === 'authority') tx = await contract.grantHalalAuthorityRole(targetAddress);
      else if (roleType === 'distributor') tx = await contract.grantDistributorRole(targetAddress);
      else if (roleType === 'retailer') tx = await contract.grantRetailerRole(targetAddress);

      await tx.wait();
      setStatus(`Success: Granted ${roleType} role to ${targetAddress.substring(0, 6)}...`);
      setTargetAddress(""); // Clear input after success
    } catch (error) {
      console.error(error);
      setStatus("Error: Action failed. Ensure you are the contract owner.");
    }
  };

  return (
    <div className="glass-card wide">
      <h1 className="card-title">Admin Control</h1>
      <p className="card-subtitle">Authorize Supply Chain Participants</p>

      <div className="form-group">
        <label className="input-label">Target Wallet Address</label>
        <input 
          type="text" 
          className="glass-input" 
          placeholder="0x..." 
          value={targetAddress}
          onChange={(e) => setTargetAddress(e.target.value)}
        />

        <div className="action-stack">
          <button className="primary-btn" onClick={() => handleGrantRole('producer')}>
            Grant Producer Role
          </button>
          <button className="primary-btn" onClick={() => handleGrantRole('slaughter')}>
            Grant Slaughterhouse Role
          </button>
          <button className="primary-btn" onClick={() => handleGrantRole('authority')}>
            Grant Halal Authority
          </button>
          <button className="primary-btn" onClick={() => handleGrantRole('distributor')}>
            Grant Distributor Role
          </button>
          <button className="primary-btn" onClick={() => handleGrantRole('retailer')}>
            Grant Retailer Role
          </button>
        </div>
      </div>

      {status && <p className="status-text">{status}</p>}

      {/* Logout button to return to Login page */}
      <button className="secondary-btn logout-btn" onClick={logout}>
        Logout / Switch Account
      </button>
    </div>
  );
}