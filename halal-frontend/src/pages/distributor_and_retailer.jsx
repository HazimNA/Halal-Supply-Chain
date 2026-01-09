import React, { useState } from 'react';
import { connectBlockchain } from "../blockchain/shared";

export default function LogisticsPortal({ role, logout }) {
  const [batchId, setBatchId] = useState("");
  const [nextOwner, setNextOwner] = useState("");
  const [status, setStatus] = useState("");

  const transfer = async () => {
    setStatus("Processing Transfer...");
    try {
      const { contract } = await connectBlockchain();
      // Uses the exact transfer function from your contract
      const tx = await contract.transferBatchOwnership(batchId, nextOwner);
      await tx.wait();
      setStatus("Transfer successful! Ownership updated on blockchain.");
    } catch (err) {
      setStatus("Transfer failed. Ensure correct role sequence.");
    }
  };

  return (
    <div className="glass-card wide">
      <h1 className="card-title">{role} Portal</h1>
      <div className="form-group">
        <input className="glass-input" placeholder="Batch ID" value={batchId} onChange={(e) => setBatchId(e.target.value)} />
        <input className="glass-input" placeholder="Recipient Address" value={nextOwner} onChange={(e) => setNextOwner(e.target.value)} />
        <button className="primary-btn" onClick={transfer}>Transfer to Next Stage</button>
      </div>
      {status && <p className="status-text">{status}</p>}
      <button className="secondary-btn logout-btn" onClick={logout}>Logout</button>
    </div>
  );
}