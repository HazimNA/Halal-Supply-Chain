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
    return alert("Format must be Name_Count (e.g., Wagyu_1)");
  }

  setLoading(true);
  try {
    const contract = await getGuestContract();
    const [targetName, targetCount] = searchInput.split("_");

    // 1. Get the Global ID using your public mapping
    // mapping(string => mapping(uint256 => uint256)) public nameAndCountToId;
    const globalId = await contract.nameAndCountToId(targetName, parseInt(targetCount));

    if (globalId.toString() === "0") {
      alert("This batch does not exist.");
      setLoading(false);
      return;
    }

    // 2. Get the full Batch details
    const batchData = await contract.getBatch(globalId);
    setResult(batchData);

  } catch (err) {
    console.error(err);
    alert("Error fetching batch. Make sure the ID is correct.");
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

      {result && (
  <div className="verification-result">
    {/* Highlight Halal Status */}
    <div className={`status-banner ${result.status === 2 ? 'halal-success' : 'pending'}`}>
      {result.status === 2 ? "🌿 SHARIAH COMPLIANT / HALAL CERTIFIED" : "🔎 Status: " + statusLabels[result.status]}
    </div>

    <div className="details-grid">
      <p><strong>Producer:</strong> {result.producer}</p>
      <p><strong>Batch Reference:</strong> {result.name}_{result.nameCount.toString()}</p>
    </div>

    {/* The most important part for the public: The Certificate */}
    {result.certificateHash ? (
      <div className="cert-box">
        <p>Verification fingerprint found on blockchain:</p>
        <code>{result.certificateHash}</code>
        <a 
          href={`https://ipfs.io/ipfs/${result.certificateHash}`} 
          target="_blank" 
          className="view-cert-btn"
        >
          View JAKIM/Authority Certificate
        </a>
      </div>
    ) : (
      <p className="warning">⚠️ No digital certificate has been uploaded yet.</p>
    )}
  </div>
)}

      <button className="secondary-btn logout-btn" onClick={logout}>
        Return to Login
      </button>
    </div>
  );
}