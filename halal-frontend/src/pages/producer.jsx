import React, { useState, useEffect } from 'react';
import { connectBlockchain } from "../blockchain/shared";

export default function Producer({ logout }) {
  const [name, setName] = useState("");
  const [targetOwner, setTargetOwner] = useState("");
  const [transferBatchId, setTransferBatchId] = useState("");
  const [transferPreview, setTransferPreview] = useState("");
  const [inventory, setInventory] = useState([]); // Storage for the table
  const [status, setStatus] = useState("");

  const statusLabels = ["Created", "Pending", "Halal", "Not Halal", "In Transit", "Retail", "Sold"];
  const ZERO = "0x0000000000000000000000000000000000000000";

  // 1. Fetch Inventory (Producer-created batches) & Transfer Preview
  const loadInventory = async () => {
    try {
      const { contract, address } = await connectBlockchain();
      const items = [];
      let i = 1;
      let keepGoing = true;

      // We stop after 100 or when getBatch fails
      while (keepGoing && i < 100) {
        try {
          const batch = await contract.getBatch(i);

          // ✅ IMPORTANT CHANGE: show batches CREATED by producer (so it stays after transfer)
          if (batch.producer.toLowerCase() === address.toLowerCase()) {
            items.push(batch);
          }
          i++;
        } catch (err) {
          keepGoing = false;
        }
      }
      setInventory([...items]);
    } catch (err) {
      console.error("Inventory error:", err);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  useEffect(() => {
    const fetchTransferPreview = async () => {
      if (!transferBatchId || isNaN(transferBatchId)) {
        setTransferPreview("");
        return;
      }
      try {
        const { contract } = await connectBlockchain();
        const batch = await contract.getBatch(transferBatchId);
        setTransferPreview(`${batch.name}_${batch.nameCount.toString()}`);
      } catch (err) {
        setTransferPreview("Batch not found");
      }
    };
    fetchTransferPreview();
  }, [transferBatchId]);

  // 2. CREATE BATCH
  const create = async () => {
    if (!name) return alert("Enter name");
    setStatus("Registering on blockchain...");

    try {
      const { contractWithSigner, contract } = await connectBlockchain();
      const writeContract =
        contractWithSigner ??
        (contract.connect ? contract.connect(await (await contract.provider).getSigner()) : contract);

      const tx = await writeContract.createBatch(name);
      const receipt = await tx.wait();

      const logs = receipt.events || receipt.logs;
      const event = logs.find(
        (e) => e.event === "BatchCreated" || e.eventName === "BatchCreated"
      );

      if (event) {
        const globalId = event.args.batchId.toString();
        setStatus(`Success! Batch "${name}" created (Global ID: #${globalId})`);
      } else {
        setStatus("Batch Registered!");
      }

      setName("");
      await loadInventory();
    } catch (err) {
      console.error("Creation Error:", err);
      setStatus("Creation failed. Check console for details.");
    }
  };

  // 3. TRANSFER BATCH
  const handleTransfer = async () => {
    try {
      const id = parseInt(transferBatchId, 10);
      if (!transferBatchId || isNaN(id) || id <= 0) {
        setStatus("Invalid Global ID");
        return;
      }

      const isAddress = /^0x[a-fA-F0-9]{40}$/.test(targetOwner);
      if (!isAddress) {
        setStatus("Invalid target address");
        return;
      }

      const { contractWithSigner, contract } = await connectBlockchain();
      const writeContract =
        contractWithSigner ??
        (contract.connect ? contract.connect(await (await contract.provider).getSigner()) : contract);

      try {
        await contract.getBatch(id);
      } catch (readErr) {
        setStatus("Batch does not exist");
        return;
      }

      const tx = await writeContract.transferBatchOwnership(id, targetOwner);
      await tx.wait();

      setStatus("Transfer Successful!");

      // ✅ Refresh table to show updated owner + status (but batch stays because producer filter)
      await loadInventory();

      setTransferBatchId("");
      setTargetOwner("");
    } catch (err) {
      console.error("Transfer Error:", err);
      const msg = err?.data?.message || err?.message || "Transfer failed. Check status/role.";
      setStatus(msg);
    }
  };

  return (
    <div className="producer-container">
      {/* CREATION CARD */}
      <div className="glass-card wide">
        <h1 className="card-title">Producer Portal</h1>
        <div className="form-group">
          <input
            className="glass-input"
            placeholder="Product Name (e.g. Wagyu)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button className="primary-btn" onClick={create}>
            Register Batch
          </button>
          {status && <p className="status-text" style={{ textAlign: "center" }}>{status}</p>}
        </div>
      </div>

      {/* TRANSFER CARD */}
      <div className="glass-card wide" style={{ marginTop: "20px" }}>
        <h2 className="card-title" style={{ fontSize: "1.2rem" }}>Transfer Ownership</h2>
        <div className="form-group">
          <input
            className="glass-input"
            placeholder="Global ID"
            value={transferBatchId}
            onChange={(e) => setTransferBatchId(e.target.value)}
          />
          {transferPreview && (
            <div style={{ color: "#2196f3", fontSize: "0.8rem" }}>Selected: {transferPreview}</div>
          )}
          <input
            className="glass-input"
            placeholder="Distributor Address"
            value={targetOwner}
            onChange={(e) => setTargetOwner(e.target.value)}
          />
          <button className="primary-btn" onClick={handleTransfer}>Transfer</button>
        </div>
      </div>

      {/* INVENTORY TABLE */}
      <div className="glass-card wide" style={{ marginTop: "20px" }}>
        <h2 className="card-title" style={{ fontSize: "1.2rem" }}>My Created Batches</h2>
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
            {inventory.map((item, idx) => (
              <tr key={idx}>
                <td>#{item.id.toString()}</td>
                <td>{item.name}_{item.nameCount ? item.nameCount.toString() : "1"}</td>
                <td>{item.name}</td>
                <td className={`status-${item.status}`}>{statusLabels[item.status]}</td>
                <td style={{ fontSize: "0.75rem", color: "#aaa" }}>
                  {item.currentOwner?.toLowerCase?.() === ZERO ? "SOLD (0x0)" : item.currentOwner}
                </td>
              </tr>
            ))}
            {inventory.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: "center", padding: "20px" }}>
                  No batches created yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
        <button className="secondary-btn logout-btn" onClick={logout} style={{ marginTop: "10px" }}>
          Logout
        </button>
      </div>
    </div>
  );
}
