import React, { useState, useEffect } from 'react';
import { connectBlockchain } from "../blockchain/shared";

export default function HalalAuthority({ logout }) {
  const [batchId, setBatchId] = useState("");
  const [productPreview, setProductPreview] = useState("");
  const [ipfsHash, setIpfsHash] = useState("");
  const [status, setStatus] = useState("");

  // Auto-fetch product name when Global ID is entered
  useEffect(() => {
    const fetchPreview = async () => {
      if (!batchId || isNaN(batchId)) {
        setProductPreview("");
        return;
      }
      try {
        const { contract } = await connectBlockchain();
        const batch = await contract.getBatch(batchId);
        // Combine Name and NameCount for the Authority's reference
        setProductPreview(`${batch.name}_${batch.nameCount.toString()}`);
      } catch (err) {
        setProductPreview("Invalid ID");
      }
    };
    fetchPreview();
  }, [batchId]);

  const certify = async (isHalal) => {
    if (!batchId || !ipfsHash) return alert("Please fill in all fields");
    
    setStatus("Signing Certificate...");
    try {
      const { contract } = await connectBlockchain();
      
      // Use the Global Batch ID (number) for the contract call
      const tx = await contract.setHalalCertificate(batchId, ipfsHash, isHalal);
      await tx.wait();
      
      setStatus(`Success: ${productPreview} is now ${isHalal ? 'Certified Halal' : 'Rejected'}.`);
      setBatchId("");
      setIpfsHash("");
    } catch (err) {
      console.error(err);
      setStatus("Error: Transaction failed. Ensure the batch is in 'Pending' status.");
    }
  };

  return (
    <div className="glass-card wide">
      <h1 className="card-title">Halal Authority Portal</h1>
      <p className="card-subtitle">Verify and Certify Product Batches</p>

      <div className="form-group">
        <label className="input-label">Enter Global Batch ID (#)</label>
        <input 
          className="glass-input" 
          type="number" 
          placeholder="e.g. 1" 
          value={batchId} 
          onChange={(e) => setBatchId(e.target.value)} 
        />
        
        {/* Verification Preview */}
        {productPreview && (
          <div style={{ marginTop: '10px', fontSize: '0.9rem', color: productPreview === "Invalid ID" ? "#ef4444" : "#2196f3" }}>
            <strong>Target Product:</strong> {productPreview}
          </div>
        )}

        <label className="input-label" style={{ marginTop: '20px' }}>IPFS Certificate Hash</label>
        <input 
          className="glass-input" 
          placeholder="Qm..." 
          value={ipfsHash} 
          onChange={(e) => setIpfsHash(e.target.value)} 
        />

        <div style={{ display: 'flex', gap: '15px', marginTop: '25px' }}>
          <button className="primary-btn" onClick={() => certify(true)} style={{ flex: 1 }}>
            Approve Halal
          </button>
          <button className="primary-btn" onClick={() => certify(false)} style={{ flex: 1, backgroundColor: '#ef4444' }}>
            Reject Batch
          </button>
        </div>
      </div>

      {status && <p className="status-text" style={{ marginTop: '20px' }}>{status}</p>}

      <button className="secondary-btn logout-btn" onClick={logout} style={{ marginTop: '30px' }}>
        Logout
      </button>
    </div>
  );
}