import React, { useState, useEffect } from 'react';
import { connectBlockchain } from "../blockchain/shared";

export default function Slaughterhouse({ logout }) {
  const [batchId, setBatchId] = useState("");
  const [productPreview, setProductPreview] = useState(""); // Holds the Wagyu_1 name
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  // AUTO-FETCH logic: Triggers when the user types in the Global ID field
  useEffect(() => {
    const fetchPreview = async () => {
      // Only fetch if batchId is a valid number
      if (!batchId || isNaN(batchId)) {
        setProductPreview("");
        return;
      }

      try {
        const { contract } = await connectBlockchain();
        const batch = await contract.getBatch(batchId);
        
        // Formats name for display, e.g., "Wagyu_1"
        if (batch.name) {
          setProductPreview(`${batch.name}_${batch.nameCount.toString()}`);
        }
      } catch (err) {
        setProductPreview("Batch not found");
      }
    };

    fetchPreview();
  }, [batchId]);

  const record = async () => {
    if (!batchId) return alert("Please enter a Batch ID");
    setLoading(true);
    setStatus("Recording processing details...");

    try {
      const { contractWithSigner, contract } = await connectBlockchain();
      const writeContract = contractWithSigner ?? (contract.connect ? contract.connect(await (await contract.provider).getSigner()) : contract);

      // Calls recordSlaughter (moves status from Created to PendingCertification)
      const tx = await writeContract.recordSlaughter(parseInt(batchId, 10), true);
      await tx.wait();

      setStatus(`Success: ${productPreview} processed. Now awaiting Halal Authority.`);
      setBatchId("");
    } catch (err) {
      console.error('Record Error:', err);
      const msg = err?.data?.message || err?.message || "Error: Ensure ID is correct and batch is in 'Created' status.";
      setStatus(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card wide">
      <header style={{ marginBottom: '2rem' }}>
        <h1 className="card-title">Slaughterhouse Portal</h1>
        <p className="card-subtitle">Update Batch Processing Status</p>
      </header>

      <div className="form-group">
        <label className="input-label">Enter Global Batch ID (#)</label>
        <input 
          className="glass-input" 
          type="number" 
          placeholder="e.g. 1" 
          value={batchId} 
          onChange={(e) => setBatchId(e.target.value)} 
        />

        {/* Verification Preview: Shows Wagyu_1 instantly */}
        {productPreview && (
          <div style={{ 
            marginTop: '10px', 
            fontSize: '0.9rem', 
            padding: '10px',
            borderRadius: '8px',
            background: 'rgba(33, 150, 243, 0.1)',
            color: productPreview === "Batch not found" ? "#ef4444" : "#2196f3",
            fontWeight: '600'
          }}>
            📋 Processing Product: {productPreview}
          </div>
        )}

        <button 
          className="primary-btn" 
          onClick={record} 
          disabled={loading || !productPreview || productPreview === "Batch not found"}
          style={{ marginTop: '20px' }}
        >
          {loading ? "Processing..." : "Confirm & Record Slaughter"}
        </button>
      </div>

      {status && (
        <p className="status-text" style={{ textAlign: 'center', marginTop: '15px' }}>
          {status}
        </p>
      )}

      <button className="secondary-btn logout-btn" onClick={logout} style={{ marginTop: '40px', width: '100%' }}>
        Logout
      </button>
    </div>
  );
}