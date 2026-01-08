import React, { useState } from 'react';
import { connectBlockchain } from "../blockchain/shared";

export default function Producer({ logout }) {
  const [name, setName] = useState("");
  const [status, setStatus] = useState("");

  const create = async () => {
    if (!name) return alert("Please enter a batch name");
    
    setStatus("Processing transaction...");
    try {
      const { contract } = await connectBlockchain();
      
      // 1. Send the transaction
      const tx = await contract.createBatch(name);
      
      // 2. Wait for the block confirmation
      const receipt = await tx.wait();

      // 3. Extract the Batch ID from the emitted event
      // Note: Assuming your event is 'BatchCreated(uint256 batchId, string name)'
      const event = receipt.logs.find(log => log.eventName === 'BatchCreated') || receipt.events[0];
      const batchId = event.args.batchId.toString();

      // 4. Update the UI with the specific notification format
      setStatus(`${name}_${batchId} created`);
      setName(""); // Clear input
      
    } catch (err) {
      console.error(err);
      setStatus("Error: Could not create batch.");
    }
  };

  return (
    <div className="glass-card">
      <h1 className="card-title">Producer</h1>
      <p className="card-subtitle">Register New Product Batch</p>
      
      <div className="form-group">
        <label className="input-label">Batch Name</label>
        <input 
          className="glass-input" 
          placeholder="e.g. Organic Beef" 
          value={name}
          onChange={(e) => setName(e.target.value)} 
        />
        
        <button className="primary-btn" onClick={create}>
          Register Batch
        </button>
      </div>

      {status && (
        <div className="status-text" style={{ marginTop: '20px' }}>
          {status}
        </div>
      )}

      <button className="secondary-btn logout-btn" onClick={logout}>
        Logout
      </button>
    </div>
  );
}