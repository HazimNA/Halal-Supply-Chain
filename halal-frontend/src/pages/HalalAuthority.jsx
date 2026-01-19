import React, { useState, useEffect } from 'react';
import { connectBlockchain } from "../blockchain/shared";

export default function HalalAuthority({ logout }) {
  const [batchId, setBatchId] = useState("");
  const [productPreview, setProductPreview] = useState("");
  const [ipfsHash, setIpfsHash] = useState(""); // CID stored on-chain
  const [status, setStatus] = useState("");

  // ✅ IPFS upload states
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // ✅ 2 tables
  const [pendingBatches, setPendingBatches] = useState([]);      // status = 1
  const [certifiedBatches, setCertifiedBatches] = useState([]);  // history (localStorage)

  const statusLabels = ["Created", "Pending", "Halal", "Not Halal", "In Transit", "Retail", "Sold"];
  const LS_KEY = "halalAuthorityCertifiedBatchIds";

  const IPFS_BACKEND_URL = import.meta.env.VITE_IPFS_BACKEND_URL || "http://localhost:5050";

  // ✅ Table 1: Pending queue
  const loadPending = async () => {
    try {
      const { contract } = await connectBlockchain();
      const items = [];
      let i = 1;
      let keepGoing = true;

      while (keepGoing && i < 100) {
        try {
          const batch = await contract.getBatch(i);
          if (Number(batch.status) === 1) items.push(batch); // PendingCertification
          i++;
        } catch (err) {
          keepGoing = false;
        }
      }
      setPendingBatches([...items]);
    } catch (err) {
      console.error("Pending load error:", err);
    }
  };

  // ✅ Table 2: Certified history
  const loadCertifiedBatches = async () => {
    try {
      const ids = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
      if (!Array.isArray(ids) || ids.length === 0) {
        setCertifiedBatches([]);
        return;
      }

      const { contract } = await connectBlockchain();
      const items = [];

      for (const id of ids) {
        try {
          const batch = await contract.getBatch(Number(id));
          items.push(batch);
        } catch (e) {}
      }

      items.sort((a, b) => Number(b.id) - Number(a.id));
      setCertifiedBatches([...items]);
    } catch (err) {
      console.error("Certified load error:", err);
    }
  };

  useEffect(() => {
    loadPending();
    loadCertifiedBatches();
  }, []);

  // Preview
  useEffect(() => {
    const fetchPreview = async () => {
      if (!batchId || isNaN(batchId)) {
        setProductPreview("");
        return;
      }
      try {
        const { contract } = await connectBlockchain();
        const batch = await contract.getBatch(batchId);
        setProductPreview(`${batch.name}_${batch.nameCount.toString()}`);
      } catch (err) {
        setProductPreview("Invalid ID");
      }
    };
    fetchPreview();
  }, [batchId]);

  // ✅ Upload file -> backend -> CID
  const uploadToIPFS = async () => {
  if (!selectedFile) return alert("Please choose a certificate file first.");

  setUploading(true);
  setStatus("Uploading certificate to IPFS...");

  try {
    const formData = new FormData();
    formData.append("file", selectedFile);

    const res = await fetch(`${IPFS_BACKEND_URL}/api/ipfs/upload`, {
      method: "POST",
      body: formData,
    });

    // ✅ read raw text first (handles non-JSON errors too)
    const raw = await res.text();
    let data = null;
    try { data = JSON.parse(raw); } catch (e) {}

    if (!res.ok) {
      const detailMsg =
        data?.error ||
        data?.details?.error ||
        (typeof data?.details === "string" ? data.details : null) ||
        raw ||
        `HTTP ${res.status}`;
      throw new Error(detailMsg);
    }

    if (!data?.cid) throw new Error("Server returned no CID");

    setIpfsHash(data.cid);
    setStatus(`✅ Upload success! CID: ${data.cid}`);
  } catch (err) {
    console.error("Upload error:", err);
    setStatus(`❌ Upload failed: ${err?.message || "Unknown error"}`);
    alert(`Upload failed: ${err?.message || "Unknown error"}`);
  } finally {
    setUploading(false);
  }
};

  const certify = async (isHalal) => {
    if (!batchId || !ipfsHash) return alert("Please fill in Batch ID and upload/paste CID.");

    setStatus("Submitting certification on-chain...");
    try {
      const { contractWithSigner, contract } = await connectBlockchain();
      const writeContract =
        contractWithSigner ??
        (contract.connect ? contract.connect(await (await contract.provider).getSigner()) : contract);

      const idNum = parseInt(batchId, 10);

      const tx = await writeContract.setHalalCertificate(idNum, ipfsHash, isHalal);
      await tx.wait();

      setStatus(`Success: ${productPreview} is now ${isHalal ? 'Certified Halal' : 'Rejected'}.`);

      // ✅ Save into local history
      const prev = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
      const next = Array.from(new Set([...(Array.isArray(prev) ? prev : []), idNum]));
      localStorage.setItem(LS_KEY, JSON.stringify(next));

      // Clear inputs
      setBatchId("");
      setSelectedFile(null);
      setIpfsHash("");

      // Refresh both tables
      await loadPending();
      await loadCertifiedBatches();

    } catch (err) {
      console.error('Certify Error:', err);
      const msg = err?.data?.message || err?.message || "Error: Ensure the batch is in 'Pending' status.";
      setStatus(msg);
    }
  };

  return (
    <>
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

          {productPreview && (
            <div style={{ marginTop: '10px', fontSize: '0.9rem', color: productPreview === "Invalid ID" ? "#ef4444" : "#2196f3" }}>
              <strong>Target Product:</strong> {productPreview}
            </div>
          )}

          {/* ✅ Upload certificate to IPFS via backend */}
          <label className="input-label" style={{ marginTop: '20px' }}>Upload Certificate (PDF/Image)</label>
          <input
            className="glass-input"
            type="file"
            accept=".pdf,image/*"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
          />

          <button
            className="primary-btn"
            onClick={uploadToIPFS}
            disabled={!selectedFile || uploading}
            style={{ marginTop: '10px' }}
          >
            {uploading ? "Uploading..." : "Upload to IPFS (Get CID)"}
          </button>

          <label className="input-label" style={{ marginTop: '20px' }}>IPFS Certificate CID</label>
          <input
            className="glass-input"
            placeholder="Qm... / bafy..."
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

      {/* ✅ TABLE 1: Pending Queue */}
      <div className="glass-card wide" style={{ marginTop: '20px' }}>
        <h2 className="card-title" style={{ fontSize: '1.2rem' }}>Pending Certification Queue</h2>
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
            {pendingBatches.length > 0 ? (
              pendingBatches.map((item, idx) => (
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
                  No pending batches.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ✅ TABLE 2: My Certified */}
      <div className="glass-card wide" style={{ marginTop: '20px' }}>
        <h2 className="card-title" style={{ fontSize: '1.2rem' }}>My Certified Batches</h2>
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Global ID</th>
              <th>Batch ID</th>
              <th>Batch Name</th>
              <th>Status</th>
              <th>Certificate CID</th>
            </tr>
          </thead>
          <tbody>
            {certifiedBatches.length > 0 ? (
              certifiedBatches.map((item, idx) => (
                <tr key={idx}>
                  <td>#{item.id.toString()}</td>
                  <td>{item.name}_{item.nameCount ? item.nameCount.toString() : "1"}</td>
                  <td>{item.name}</td>
                  <td className={`status-${item.status}`}>{statusLabels[item.status]}</td>
                  <td style={{ fontSize: "0.75rem", color: "#aaa" }}>
                    {item.certificateHash ? `${item.certificateHash.slice(0, 12)}...` : "-"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                  No certified batches yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
