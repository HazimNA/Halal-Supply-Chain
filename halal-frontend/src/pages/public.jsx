import React, { useState, useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { getGuestContract } from "../blockchain/shared";

export default function Public({ logout }) {
  const [searchInput, setSearchInput] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const statusLabels = [
    "Batch Created",
    "Pending Certification",
    "Certified Halal",
    "Not Halal",
    "In Transit",
    "At Retailer",
    "Sold",
  ];

  // ✅ ONLY Name_Count (e.g. Wagyu_1)
  const handleManualSearch = async () => {
    const input = (searchInput || "").trim();
    if (!input) return;

    // Must contain an underscore separating name and count
    const lastUnderscore = input.lastIndexOf("_");
    if (lastUnderscore === -1) {
      return alert("Format must be BatchName_Count (e.g., Wagyu_1)");
    }

    const targetName = input.slice(0, lastUnderscore).trim();
    const targetCountStr = input.slice(lastUnderscore + 1).trim();

    if (!targetName || !/^\d+$/.test(targetCountStr)) {
      return alert("Format must be BatchName_Count (e.g., Wagyu_1)");
    }

    setLoading(true);
    try {
      const contract = await getGuestContract();
      const targetCount = parseInt(targetCountStr, 10);

      // mapping(string => mapping(uint256 => uint256)) public nameAndCountToId;
      const globalId = await contract.nameAndCountToId(targetName, targetCount);

      if (globalId.toString() === "0") {
        alert(
          "Batch not found.\nMake sure:\n1) Name matches EXACTLY (uppercase/lowercase)\n2) Count is correct (e.g. Wagyu_1)"
        );
        return;
      }

      const batchData = await contract.getBatch(globalId);
      setResult(batchData);
    } catch (err) {
      console.error(err);
      alert("Error fetching batch. Check the BatchName_Count and network.");
    } finally {
      setLoading(false);
    }
  };

  // QR scanner reads Global ID (this is okay even if manual is name_count)
  useEffect(() => {
    const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 });

    scanner.render(
      async (id) => {
        try {
          const contract = await getGuestContract();
          const parsedId = parseInt(String(id).trim(), 10);

          if (Number.isNaN(parsedId) || parsedId <= 0) {
            alert("Invalid QR Code.");
            return;
          }

          const data = await contract.getBatch(parsedId);
          setResult(data);

          await scanner.clear();
        } catch (err) {
          console.error(err);
          alert("Invalid QR Code.");
        }
      },
      () => {}
    );

    return () => {
      try {
        scanner.clear();
      } catch (e) {}
    };
  }, []);

  return (
    <div className="glass-card wide">
      <header style={{ marginBottom: "2rem" }}>
        <h1 className="card-title">Consumer Verify</h1>
        <p className="card-subtitle">Check Halal Integrity & Traceability</p>
      </header>

      {/* MANUAL SEARCH SECTION */}
      <section className="form-group" style={{ marginBottom: "2.5rem" }}>
        <div style={{ position: "relative" }}>
          <input
            className="glass-input"
            style={{ width: "100%", paddingRight: "120px" }}
            placeholder="Enter BatchName_id (e.g. Wagyu_1)"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button
            className="primary-btn"
            style={{
              position: "absolute",
              right: "5px",
              top: "5px",
              padding: "10px 20px",
              fontSize: "0.85rem",
            }}
            onClick={handleManualSearch}
            disabled={loading}
          >
            {loading ? "..." : "Verify"}
          </button>
        </div>
      </section>

      <div
        className="divider"
        style={{ margin: "20px 0", color: "#64748b", fontSize: "0.8rem" }}
      >
        OR SCAN QR CODE
      </div>

      {/* QR SCANNER SECTION */}
      <div id="reader" className="scanner-box"></div>

      {result && (
        <div className="verification-result">
          <div
            className={`status-banner ${
              Number(result.status) === 2 ? "halal-success" : "pending"
            }`}
          >
            {Number(result.status) === 2
              ? "🌿 SHARIAH COMPLIANT / HALAL CERTIFIED"
              : "🔎 Status: " + statusLabels[Number(result.status)]}
          </div>

          <div className="details-grid">
            <p>
              <strong>Producer:</strong> {result.producer}
            </p>
            <p>
              <strong>Batch Reference:</strong> {result.name}_{result.nameCount.toString()}
            </p>
            <p>
              <strong>Global ID:</strong> #{result.id.toString()}
            </p>
          </div>

          {result.certificateHash ? (
            <div className="cert-box">
              <p>Verification fingerprint found on blockchain:</p>
              <code>{result.certificateHash}</code>
              <a
                href={`https://olive-impressive-condor-789.mypinata.cloud/ipfs/${result.certificateHash}`}
                target="_blank"
                rel="noreferrer"
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
