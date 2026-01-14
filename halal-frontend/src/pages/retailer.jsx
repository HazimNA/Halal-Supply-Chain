import React, { useState, useEffect } from 'react';
import { connectBlockchain } from "../blockchain/shared";

export default function Retailer({ logout }) {
  const [targetBatchId, setTargetBatchId] = useState(""); // Input field state
  const [inventory, setInventory] = useState([]);
  const [statusMsg, setStatusMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const statusLabels = ["Created", "Pending", "Halal", "Not Halal", "In Transit", "Retail", "Sold"];

  // 1. Load inventory using the loop method (as you preferred)
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

  useEffect(() => {
    loadRetailerData();
  }, []);

  // 2. Update status to SOLD via manual ID entry
  const handleMarkAsSold = async () => {
    if (!targetBatchId) return alert("Please enter a Global Batch ID");
    
    setStatusMsg(`Updating Batch #${targetBatchId}...`);
    try {
      const { contractWithSigner, contract } = await connectBlockchain();
      const writeContract = contractWithSigner ?? (contract.connect ? contract.connect(await (await contract.provider).getSigner()) : contract);

      // Prefer calling markAsSold if the contract supports it (newer deployments).
      const id = parseInt(targetBatchId, 10);
      if (typeof writeContract.markAsSold === 'function') {
        const tx = await writeContract.markAsSold(id);
        await tx.wait();
      } else {
        // Older deployments may not have markAsSold; transfer to zero address is not allowed by role checks.
        setStatusMsg('Contract does not support markAsSold. Redeploy contract with markAsSold or perform an approved transfer.');
        return;
      }
      setStatusMsg(`Batch #${targetBatchId} marked as SOLD!`);
      setTargetBatchId(""); // Clear input
      loadRetailerData(); // Refresh the table
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

      {/* INVENTORY TABLE */}
      <div className="glass-card wide" style={{ marginTop: '20px' }}>
        <h2 className="card-title" style={{fontSize: '1.2rem'}}>Your Current Stock</h2>
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

      <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <button className="secondary-btn logout-btn" onClick={logout} style={{ marginTop: '20px' }}>
          Logout
        </button>
      </div>
    </div>
  );
}