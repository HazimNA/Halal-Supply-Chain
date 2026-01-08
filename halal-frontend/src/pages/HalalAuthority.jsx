import React, { useState } from 'react';
import { connectBlockchain } from "../blockchain/shared";

export default function Authority() {
  const [batchId, setBatchId] = useState("");
  const [ipfsHash, setIpfsHash] = useState("");
  const [isHalal, setIsHalal] = useState(true); // Default to true
  const [status, setStatus] = useState("");

  const handleIssueCertificate = async () => {
    if (!batchId || !ipfsHash) return alert("Please fill in all fields");
    
    setStatus("Updating Blockchain...");
    try {
      const { contract } = await connectBlockchain();
      
      // Calls the setHalalCertificate function in your Solidity contract
      // Parameters: (uint256 batchId, string memory certificateHash, bool isHalal)
      const tx = await contract.setHalalCertificate(batchId, ipfsHash, isHalal);
      
      await tx.wait();
      setStatus(`Success! Batch #${batchId} is now ${isHalal ? 'Certified' : 'Rejected'}.`);
      
      // Clear inputs for next entry
      setBatchId("");
      setIpfsHash("");
    } catch (error) {
      console.error(error);
      setStatus("Error: Transaction failed. Ensure you have the 'Authority' role.");
    }
  };

  return (
    <div className="login-container admin-card">
      <h1 className="login-title">Halal Authority</h1>
      <p className="login-subtitle">Issue Digital Certification</p>

      <div className="admin-form">
        <label className="input-label">Batch ID</label>
        <input 
          type="number" 
          className="admin-input" 
          placeholder="Enter Batch ID (e.g. 1)" 
          value={batchId}
          onChange={(e) => setBatchId(e.target.value)}
        />

        <label className="input-label">IPFS Certificate Hash</label>
        <input 
          type="text" 
          className="admin-input" 
          placeholder="Paste Hash (Qm...)" 
          value={ipfsHash}
          onChange={(e) => setIpfsHash(e.target.value)}
        />

        <label className="input-label">Verification Result</label>
        <select 
          className="admin-input" 
          value={isHalal} 
          onChange={(e) => setIsHalal(e.target.value === "true")}
        >
          <option value="true">✅ Halal Certified</option>
          <option value="false">❌ Non-Halal / Rejected</option>
        </select>

        <button className="login-button" onClick={handleIssueCertificate}>
          Sign & Issue Certificate
        </button>
      </div>

      {status && <p className="status-text">{status}</p>}
    </div>
  );
}