import React, { useState, useEffect } from 'react';
import { connectBlockchain } from "../blockchain/shared";

export default function LogisticsPortal({ role, logout }) {
  const [batchId, setBatchId] = useState("");
  const [nextOwner, setNextOwner] = useState("");
  const [status, setStatus] = useState("");
  const [preview, setPreview] = useState("");

  // ✅ NEW: 2 tables
  const [ownedInventory, setOwnedInventory] = useState([]);      // current owned
  const [handledBatches, setHandledBatches] = useState([]);      // history

  const statusLabels = ["Created", "Pending", "Halal", "Not Halal", "In Transit", "Retail", "Sold"];
  const LS_KEY = "distributorHandledBatchIds";

  // ✅ Table 1: Load inventory owned by current distributor wallet
  const loadOwnedInventory = async () => {
    try {
      const { contract, address } = await connectBlockchain();
      const items = [];
      let i = 1;
      let keepGoing = true;

      while (keepGoing && i < 100) {
        try {
          const batch = await contract.getBatch(i);
          if (batch.currentOwner.toLowerCase() === address.toLowerCase()) {
            items.push(batch);
          }
          i++;
        } catch (err) {
          keepGoing = false;
        }
      }
      setOwnedInventory([...items]);
    } catch (err) {
      console.error("Owned inventory error:", err);
    }
  };

  // ✅ Table 2: Load handled batches (history) from localStorage + refresh from chain
  const loadHandledBatches = async () => {
    try {
      const ids = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
      if (!Array.isArray(ids) || ids.length === 0) {
        setHandledBatches([]);
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
      setHandledBatches([...items]);
    } catch (err) {
      console.error("Handled batches load error:", err);
    }
  };

  // initial load
  useEffect(() => {
    loadOwnedInventory();
    loadHandledBatches();
  }, []);

  // 1. Safe Preview Logic (Runs when user types Batch ID)
  useEffect(() => {
    let isMounted = true;
    const fetchPreview = async () => {
      if (!batchId || isNaN(batchId) || parseInt(batchId) <= 0) {
        setPreview("");
        return;
      }
      try {
        const { contract } = await connectBlockchain();
        const batch = await contract.getBatch(parseInt(batchId, 10));
        if (isMounted) setPreview(`${batch.name} (Global ID: #${batch.id})`);
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
      const writeContract =
        contractWithSigner ??
        (contract.connect ? contract.connect(await (await contract.provider).getSigner()) : contract);

      const idNum = parseInt(batchId, 10);

      const tx = await writeContract.transferBatchOwnership(idNum, nextOwner);
      await tx.wait();

      setStatus("Success! Ownership updated on blockchain.");
      setBatchId("");
      setNextOwner("");

      // ✅ Save to handled history
      const prev = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
      const next = Array.from(new Set([...(Array.isArray(prev) ? prev : []), idNum]));
      localStorage.setItem(LS_KEY, JSON.stringify(next));

      // ✅ refresh both tables
      await loadOwnedInventory();
      await loadHandledBatches();

    } catch (err) {
      console.error("Logistics error:", err);
      const msg =
        err?.data?.message ||
        err?.message ||
        "Transfer failed. Check if: 1. You own this batch. 2. Status is correct. 3. Recipient role is correct.";
      setStatus(msg);
    }
  };

  return (
    <div className="logistics-container" style={{ padding: '20px' }}>
      <div className="glass-card wide">
        <h1 className="card-title">{role} Portal</h1>
        <p className="card-subtitle">Manage batch movement across the supply chain</p>

        <div className="form-group">
          <label style={{ color: '#ccc', fontSize: '0.8rem' }}>Batch to Transfer:</label>
          <input
            className="glass-input"
            placeholder="Enter Global Batch ID"
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
          />
          {preview && <div style={{ color: '#2196f3', fontSize: '0.8rem', padding: '5px' }}>{preview}</div>}

          <label style={{ color: '#ccc', fontSize: '0.8rem', marginTop: '10px' }}>Recipient Wallet:</label>
          <input
            className="glass-input"
            placeholder="0x... Recipient Address"
            value={nextOwner}
            onChange={(e) => setNextOwner(e.target.value)}
          />

          <button className="primary-btn" onClick={transfer} style={{ marginTop: '15px' }}>
            Confirm & Ship Batch
          </button>
        </div>

        {status && <p className="status-text" style={{ textAlign: 'center', margin: '15px 0' }}>{status}</p>}

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button className="secondary-btn logout-btn" onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      {/* ✅ TABLE 1: Current Owned */}
      <div className="glass-card wide" style={{ marginTop: '20px' }}>
        <h2 className="card-title" style={{ fontSize: '1.2rem' }}>My Current Stock</h2>
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Global ID</th>
              <th>Batch ID</th>
              <th>Product Name</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {ownedInventory.length > 0 ? (
              ownedInventory.map((item, idx) => (
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
                  No batches currently owned.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ✅ TABLE 2: Handled History */}
      <div className="glass-card wide" style={{ marginTop: '20px' }}>
        <h2 className="card-title" style={{ fontSize: '1.2rem' }}>Batches Handled</h2>
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Global ID</th>
              <th>Batch ID</th>
              <th>Product Name</th>
              <th>Status</th>
              <th>Current Owner</th>
            </tr>
          </thead>
          <tbody>
            {handledBatches.length > 0 ? (
              handledBatches.map((item, idx) => (
                <tr key={idx}>
                  <td>#{item.id.toString()}</td>
                  <td>{item.name}_{item.nameCount ? item.nameCount.toString() : "1"}</td>
                  <td>{item.name}</td>
                  <td className={`status-${item.status}`}>{statusLabels[item.status]}</td>
                  <td style={{ fontSize: "0.75rem", color: "#aaa" }}>{item.currentOwner}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                  No handled batches yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
