import React, { useState, useEffect } from 'react';
import { connectBlockchain } from "../blockchain/shared";

export default function Slaughterhouse({ logout }) {
  const [batchId, setBatchId] = useState("");
  const [productPreview, setProductPreview] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ table now shows "batches I recorded"
  const [recordedBatches, setRecordedBatches] = useState([]);

  const statusLabels = ["Created", "Pending", "Halal", "Not Halal", "In Transit", "Retail", "Sold"];
  const LS_KEY = "slaughterhouseRecordedBatchIds";

  // ✅ Load batches recorded by THIS slaughterhouse browser (local history)
  const loadRecordedBatches = async () => {
    try {
      const ids = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
      if (!Array.isArray(ids) || ids.length === 0) {
        setRecordedBatches([]);
        return;
      }

      const { contract } = await connectBlockchain();
      const items = [];

      for (const id of ids) {
        try {
          const batch = await contract.getBatch(Number(id));
          items.push(batch);
        } catch (e) {
          // skip missing
        }
      }

      items.sort((a, b) => Number(b.id) - Number(a.id));
      setRecordedBatches([...items]);
    } catch (err) {
      console.error("Recorded batches load error:", err);
    }
  };

  useEffect(() => {
    loadRecordedBatches();
  }, []);

  // Preview by ID
  useEffect(() => {
    const fetchPreview = async () => {
      if (!batchId || isNaN(batchId)) {
        setProductPreview("");
        return;
      }

      try {
        const { contract } = await connectBlockchain();
        const batch = await contract.getBatch(batchId);

        if (batch.name) setProductPreview(`${batch.name}_${batch.nameCount.toString()}`);
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
      const writeContract =
        contractWithSigner ??
        (contract.connect ? contract.connect(await (await contract.provider).getSigner()) : contract);

      const idNum = parseInt(batchId, 10);

      // Calls recordSlaughter (moves status from Created -> PendingCertification)
      const tx = await writeContract.recordSlaughter(idNum, true);
      await tx.wait();

      setStatus(`Success: ${productPreview} processed. Now awaiting Halal Authority.`);
      setBatchId("");

      // ✅ Save this id into localStorage "history"
      const prev = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
      const next = Array.from(new Set([...(Array.isArray(prev) ? prev : []), idNum]));
      localStorage.setItem(LS_KEY, JSON.stringify(next));

      // ✅ refresh table
      await loadRecordedBatches();

    } catch (err) {
      console.error('Record Error:', err);
      const msg = err?.data?.message || err?.message || "Error: Ensure ID is correct and batch is in 'Created' status.";
      setStatus(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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

      {/* ✅ Recorded History Table (stays after status changes) */}
      <div className="glass-card wide" style={{ marginTop: '20px' }}>
        <h2 className="card-title" style={{ fontSize: '1.2rem' }}>Batches I Recorded</h2>
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Global ID</th>
              <th>Batch ID</th>
              <th>Batch Name</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {recordedBatches.length > 0 ? (
              recordedBatches.map((item, idx) => (
                <tr key={idx}>
                  <td>#{item.id.toString()}</td>
                  <td>{item.name}_{item.nameCount ? item.nameCount.toString() : "1"}</td>
                  <td>{item.name}</td>
                  <td className={`status-${item.status}`}>{statusLabels[item.status]}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>
                  No recorded batches yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
