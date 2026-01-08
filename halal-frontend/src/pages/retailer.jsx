import { useState } from "react";
import { connectBlockchain } from "../blockchain/shared";

export default function Retailer() {
  const [id, setId] = useState("");

  const sell = async () => {
    const { contract } = await connectBlockchain();
    const tx = await contract.updateBatchStatus(id, 6);
    await tx.wait();
    alert("Sold");
  };

  return (
    <div>
      <h2>Retailer</h2>
      <input placeholder="Batch ID" onChange={e => setId(e.target.value)} />
      <button onClick={sell}>Sell</button>
    </div>
  );
}