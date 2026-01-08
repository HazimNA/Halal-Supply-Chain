import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from "html5-qrcode";
import { getGuestContract } from "../blockchain/shared";

export default function Public({ logout }) {
  const [result, setResult] = useState(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 });
    scanner.render(async (id) => {
      try {
        const contract = await getGuestContract();
        const data = await contract.getBatch(id);
        setResult(data);
        scanner.clear();
      } catch (err) { alert("Batch ID not found."); }
    });
    return () => scanner.clear();
  }, []);

  return (
    <div className="glass-card">
      <h1 className="card-title">Verify Status</h1>
      <div id="reader" className="scanner-box"></div>
      {result && (
        <div className="status-card">
          <div className="result-header">{result.status === 4 ? "✅ HALAL" : "⏳ PENDING"}</div>
          <p>Product: {result.name}</p>
          {result.certificateHash && (
            <a href={`https://gateway.pinata.cloud/ipfs/${result.certificateHash}`} target="_blank" className="cert-link">View IPFS Certificate</a>
          )}
        </div>
      )}
      <button className="secondary-btn logout-btn" onClick={logout}>Back to Home</button>
    </div>
  );
}