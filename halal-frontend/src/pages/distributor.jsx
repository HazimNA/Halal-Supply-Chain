import React, { useState } from 'react';
import { connectBlockchain } from "../blockchain/shared";

export default function Distributor({ logout }) {
  const [id, setId] = useState("");
  const [next, setNext] = useState("");

  const transfer = async () => {
    const { contract } = await connectBlockchain();
    const tx = await contract.transferBatch(id, next);
    await tx.wait();
    alert("Transferred!");
  };

  return (
    <div className="glass-card">
      <h1 className="card-title">Logistics</h1>
      <input className="glass-input" placeholder="Batch ID" onChange={(e)=>setId(e.target.value)} />
      <input className="glass-input" placeholder="Next Wallet Address" onChange={(e)=>setNext(e.target.value)} />
      <button className="primary-btn" onClick={transfer}>Transfer Ownership</button>
      <button className="secondary-btn logout-btn" onClick={logout}>Logout</button>
    </div>
  );
}