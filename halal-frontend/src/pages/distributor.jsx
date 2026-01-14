import React, { useState, useEffect } from 'react'; // Added useEffect import
import { connectBlockchain } from "../blockchain/shared";

export default function LogisticsPortal({ role, logout }) {
  const [batchId, setBatchId] = useState("");
  const [nextOwner, setNextOwner] = useState("");
  const [status, setStatus] = useState("");
  const [preview, setPreview] = useState(""); // Renamed for this component

  // 1. Safe Preview Logic (Runs when user types Batch ID)
  useEffect(() => {
    let isMounted = true;
    const fetchPreview = async () => {
      // Don't call blockchain if ID is invalid or empty
      if (!batchId || isNaN(batchId) || parseInt(batchId) <= 0) {
        setPreview("");
        return;
      }
      try {
        const { contract } = await connectBlockchain();
        const batch = await contract.getBatch(parseInt(batchId));
        if (isMounted) {
          setPreview(`${batch.name} (Global ID: #${batch.id})`);
        }
      } catch (err) {
        if (isMounted) setPreview("Batch not found on-chain");
      }
    };

    fetchPreview();
    return () => { isMounted = false; };
  }, [batchId]);

  // 2. Transfer Function
  const transfer = async () => {
    if (!batchId || !nextOwner) return alert("Please fill in all fields.");
    setStatus("Processing Transfer...");
    
    try {
      const { contractWithSigner, contract } = await connectBlockchain();
      const writeContract = contractWithSigner ?? (contract.connect ? contract.connect(await (await contract.provider).getSigner()) : contract);

      // Step 1: Send Transaction using signer-backed contract
      const tx = await writeContract.transferBatchOwnership(parseInt(batchId, 10), nextOwner);

      // Step 2: Wait for Blockchain Confirmation
      await tx.wait();
      
      setStatus("Success! Ownership updated on blockchain.");
      setBatchId("");
      setNextOwner("");
    } catch (err) {
      console.error("Logistics error:", err);
      // Provides common failure reasons for supply chain logic
      const msg = err?.data?.message || err?.message || "Transfer failed. Check if: 1. You own this batch. 2. Status is 'Certified Halal'. 3. Recipient role is correct.";
      setStatus(msg);
    }
  };

  return (
    <div className="logistics-container" style={{ padding: '20px' }}>
      <div className="glass-card wide">
        <h1 className="card-title">{role} Portal</h1>
        <p className="card-subtitle">Manage batch movement across the supply chain</p>
        
        <div className="form-group">
          <label style={{color: '#ccc', fontSize: '0.8rem'}}>Batch to Transfer:</label>
          <input 
            className="glass-input" 
            placeholder="Enter Global Batch ID" 
            value={batchId} 
            onChange={(e) => setBatchId(e.target.value)} 
          />
          {preview && <div style={{color: '#2196f3', fontSize: '0.8rem', padding: '5px'}}>{preview}</div>}
          
          <label style={{color: '#ccc', fontSize: '0.8rem', marginTop: '10px'}}>Recipient Wallet:</label>
          <input 
            className="glass-input" 
            placeholder="0x... Recipient Address" 
            value={nextOwner} 
            onChange={(e) => setNextOwner(e.target.value)} 
          />
          
          <button className="primary-btn" onClick={transfer} style={{marginTop: '15px'}}>
            Confirm & Ship Batch
          </button>
        </div>

        {status && <p className="status-text" style={{textAlign: 'center', margin: '15px 0'}}>{status}</p>}
        
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button className="secondary-btn logout-btn" onClick={logout}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}