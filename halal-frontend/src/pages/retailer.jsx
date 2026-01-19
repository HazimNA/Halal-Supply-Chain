import React, { useState, useEffect } from 'react';
import { connectBlockchain } from "../blockchain/shared";

export default function Retailer({ logout }) {
  const [targetBatchId, setTargetBatchId] = useState(""); // Input field state
  const [inventory, setInventory] = useState([]); // current owned stock
  const [soldHistory, setSoldHistory] = useState([]); // ✅ NEW: sold batches history
  const [statusMsg, setStatusMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const statusLabels = ["Created", "Pending", "Halal", "Not Halal", "In Transit", "Retail", "Sold"];
  const LS_KEY = "retailerSoldBatchIds";

  // 1) Load current owned inventory (your existing logic)
  const loadRetailerData = async () => {
    setLoading(true);
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
        } catch (err) { keepGoing = false; }
      }
      setInventory([...items]);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Load Sold history from localStorage and refresh from blockchain
  const loadSoldHistory = async () => {
    try {
      const ids = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
      if (!Array.isArray(ids) || ids.length === 0) {
        setSoldHistory([]);
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

      // newest first (optional)
      items.sort((a, b) => Number(b.id) - Number(a.id));

      setSoldHistory([...items]);
    } catch (err) {
      console.error("Sold history load error:", err);
    }
  };

  useEffect(() => {
    loadRetailerData();
    loadSoldHistory(); // ✅ NEW
  }, []);

  // 2) Update status to SOLD via manual ID entry
  const handleMarkAsSold = async () => {
    if (!targetBatchId) return alert("Please enter a Global Batch ID");

    setStatusMsg(`Updating Batch #${targetBatchId}...`);
    try {
      const { contractWithSigner, contract } = await connectBlockchain();
      const writeContract =
        contractWithSigner ??
        (contract.connect ? contract.connect(await (await contract.provider).getSigner()) : contract);

      const id = parseInt(targetBatchId, 10);

      if (typeof writeContract.markAsSold === 'function') {
        const tx = await writeContract.markAsSold(id);
        await tx.wait();
      } else {
        setStatusMsg('Contract does not support markAsSold. Redeploy contract with markAsSold or perform an approved transfer.');
        return;
      }

      setStatusMsg(`Batch #${targetBatchId} marked as SOLD!`);
      setTargetBatchId(""); // Clear input

      // ✅ Save into localStorage sold history
      const prev = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
      const next = Array.from(new Set([...(Array.isArray(prev) ? prev : []), id]));
      localStorage.setItem(LS_KEY, JSON.stringify(next));

      // ✅ Refresh both tables
      await loadRetailerData();   // current stock (may reduce)
      await loadSoldHistory();    // history (will include the sold batch)

    } catch (err) {
      console.error('MarkSold Error:', err);
      const msg = err?.data?.message || err?.message || "Failed. Ensure you own this batch and its status is 'Retail'.";
      setStatusMsg(msg);
    }
  };

  return (
    <div className="producer-container">
      {/* UPDATE SECTION */}
      <div className="glass-card wide">
        <h1 className="card-title">Retailer Portal</h1>
        <p className="card-subtitle" style={{textAlign: 'center'}}>Finalize product sale by Global ID</p>

        <div className="form-group">
          <input
            className="glass-input"
            placeholder="Enter Global Batch ID (e.g. 5)"
            value={targetBatchId}
            onChange={(e) => setTargetBatchId(e.target.value)}
          />
          <button className="primary-btn" onClick={handleMarkAsSold}>
            Confirm Sale (Mark as Sold)
          </button>
        </div>
        {statusMsg && <p className="status-text" style={{textAlign: 'center', color: '#ffd700'}}>{statusMsg}</p>}
      </div>

      {/* INVENTORY TABLE (CURRENT OWNED) */}
      <div className="glass-card wide" style={{ marginTop: '20px' }}>
        <h2 className="card-title" style={{fontSize: '1.2rem'}}>Current Stock</h2>
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Global ID</th>
              <th>Batch ID</th>
              <th>Batch Name</th>
              <th>Status</th>
              <th>Ownership</th>
            </tr>
          </thead>
          <tbody>
            {inventory.length > 0 ? (
              inventory.map((item, idx) => (
                <tr key={idx}>
                  <td>#{item.id.toString()}</td>
                  <td>{item.name}_{item.nameCount ? item.nameCount.toString() : "1"}</td>
                  <td>{item.name}</td>
                  <td className={`status-${item.status}`}>{statusLabels[item.status]}</td>
                  <td style={{fontSize: '0.7rem', color: '#aaa'}}>You (Current)</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{textAlign: 'center', padding: '20px'}}>
                  {loading ? "Searching blockchain..." : "No items found in your stock."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ✅ SOLD HISTORY TABLE (WON’T DISAPPEAR AFTER SOLD) */}
      <div className="glass-card wide" style={{ marginTop: '20px' }}>
        <h2 className="card-title" style={{fontSize: '1.2rem'}}>Sold History</h2>
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Global ID</th>
              <th>Batch ID</th>
              <th>Batch Name</th>
              <th>Status</th>
              <th>Owner</th>
            </tr>
          </thead>
          <tbody>
            {soldHistory.length > 0 ? (
              soldHistory.map((item, idx) => (
                <tr key={idx}>
                  <td>#{item.id.toString()}</td>
                  <td>{item.name}_{item.nameCount ? item.nameCount.toString() : "1"}</td>
                  <td>{item.name}</td>
                  <td className={`status-${item.status}`}>{statusLabels[item.status]}</td>
                  <td style={{fontSize: '0.7rem', color: '#aaa'}}>
                    {item.currentOwner === "0x0000000000000000000000000000000000000000"
                      ? "SOLD (0x0)"
                      : item.currentOwner}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{textAlign: 'center', padding: '20px'}}>
                  No sold batches yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <button className="secondary-btn logout-btn" onClick={logout} style={{ marginTop: '20px' }}>
          Logout
        </button>
      </div>
    </div>
  );
}
