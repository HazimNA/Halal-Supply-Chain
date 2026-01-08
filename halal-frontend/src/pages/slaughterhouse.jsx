import React, { useState } from 'react';
import { connectBlockchain } from "../blockchain/shared";

export default function Slaughterhouse({ logout }) {
  const [id, setId] = useState("");

  const process = async () => {
    const { contract } = await connectBlockchain();
    const tx = await contract.recordSlaughter(id);
    await tx.wait();
    alert("Slaughter Recorded!");
  };

  return (
    <div className="glass-card">
      <h1 className="card-title">Slaughterhouse</h1>
      <input className="glass-input" placeholder="Batch ID" onChange={(e)=>setId(e.target.value)} />
      <button className="primary-btn" onClick={process}>Confirm Slaughter</button>
      <button className="secondary-btn logout-btn" onClick={logout}>Logout</button>
    </div>
  );
}