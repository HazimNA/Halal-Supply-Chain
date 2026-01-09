import React, { useState, useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { getGuestContract } from "../blockchain/shared";

export default function Public({ logout }) {
  const [searchInput, setSearchInput] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Status mapping for human-readable labels
  const statusLabels = [
    "Batch Created", 
    "Pending Certification", 
    "Certified Halal", 
    "Not Halal", 
    "In Transit", 
    "At Retailer", 
    "Sold"
  ];

  const handleManualSearch = async () => {
    if (!searchInput.includes("_")) {
      return alert("Please use the format: Product_ID (e.g., Wagyu_1)");
    }

    setLoading(true);
    try {
      const contract = await getGuestContract(); // Connects via RPC
      const [targetName, targetCount] = searchInput.split("_");
      
      const totalBatches = await contract.batchCount();
      let foundBatch = null;

      // Search logic for per-name incrementing batches
      for (let i = 1; i <= totalBatches; i++) {
        const batch = await contract.getBatch(i);
        if (
          batch.name.toLowerCase() === targetName.toLowerCase() &&
          batch.nameCount.toString() === targetCount
        ) {
          foundBatch = batch;
          break;
        }
      }

      if (foundBatch) setResult(foundBatch);
      else alert("Product batch not found.");
      
    } catch (err) {
      alert("Error accessing blockchain node.");
    }
    setLoading(false);
  };

  useEffect(() => {
    const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 });
    scanner.render(async (id) => {
      try {
        const contract = await getGuestContract();
        const data = await contract.getBatch(id);
        setResult(data);
        scanner.clear();
      } catch (err) { alert("Invalid QR Code."); }
    });
    return () => scanner.clear();
  }, []);

  return (
    <div className="glass-card wide">
      <header style={{ marginBottom: '2rem' }}>
        <h1 className="card-title">Consumer Verify</h1>
        <p className="card-subtitle">Check Halal Integrity & Traceability</p>
      </header>

      {/* MANUAL SEARCH SECTION */}
      <section className="form-group" style={{ marginBottom: '2.5rem' }}>
        <div style={{ position: 'relative' }}>
          <input
            className="glass-input"
            style={{ width: '100%', paddingRight: '120px' }}
            placeholder="Enter Product_ID (e.g. Wagyu_1)"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button 
            className="primary-btn" 
            style={{ position: 'absolute', right: '5px', top: '5px', padding: '10px 20px', fontSize: '0.85rem' }}
            onClick={handleManualSearch}
            disabled={loading}
          >
            {loading ? "..." : "Verify"}
          </button>
        </div>
      </section>

      <div className="divider" style={{ margin: '20px 0', color: '#64748b', fontSize: '0.8rem' }}>
        OR SCAN QR CODE
      </div>

      {/* QR SCANNER SECTION */}
      <div id="reader" className="scanner-box"></div>

      {/* VERIFICATION RESULT VISUAL */}
      {result && (
        <div className="status-card" style={{ animation: 'fadeIn 0.5s ease' }}>
          <div className="result-header" style={{ color: result.status === 2 ? '#4caf50' : '#ff9800' }}>
            {result.status === 2 ? "✅ CERTIFIED HALAL" : "🔎 STATUS: " + statusLabels[result.status]}
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '15px', fontSize: '0.9rem' }}>
            <div>
              <span style={{ color: '#94a3b8', display: 'block' }}>Product Name</span>
              <strong>{result.name}_{result.nameCount.toString()}</strong>
            </div>
            <div>
              <span style={{ color: '#94a3b8', display: 'block' }}>Blockchain ID</span>
              <strong>#{result.id.toString()}</strong>
            </div>
          </div>

          {result.certificateHash && (
            <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <a 
                href={`https://gateway.pinata.cloud/ipfs/${result.certificateHash}`} 
                target="_blank" 
                rel="noreferrer"
                className="cert-link"
              >
                📜 View Digital Halal Certificate (IPFS)
              </a>
            </div>
          )}
        </div>
      )}

      <button className="secondary-btn logout-btn" onClick={logout}>
        Return to Login
      </button>
    </div>
  );
}