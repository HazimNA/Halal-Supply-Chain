import React, { useState } from 'react';
import { connectBlockchain } from "../blockchain/shared";

export default function Admin({ logout }) {
  const [targetAddress, setTargetAddress] = useState("");
  const [status, setStatus] = useState("");

  const isValidAddress = (a) => /^0x[a-fA-F0-9]{40}$/.test(a);

  const handleGrantRole = async (roleType) => {
    if (!targetAddress) return alert("Please enter a wallet address");
    if (!isValidAddress(targetAddress)) return alert("Invalid Ethereum address");
    setStatus("Processing...");

    try {
      const { contractWithSigner, signer, contract } = await connectBlockchain();
      const txContract = contractWithSigner ?? (signer ? contract.connect(signer) : null);
      if (!txContract) {
        setStatus("");
        return alert("No signer available. Connect MetaMask and unlock an account.");
      }

      let tx;
      if (roleType === 'producer') {tx = await txContract.grantProducerRole(targetAddress);}
      else if (roleType === 'slaughter') {tx = await txContract.grantSlaughterhouseRole(targetAddress);}
      else if (roleType === 'authority') {tx = await txContract.grantHalalAuthorityRole(targetAddress);}
      else if (roleType === 'distributor') {tx = await txContract.grantDistributorRole(targetAddress);}
      else if (roleType === 'retailer') {tx = await txContract.grantRetailerRole(targetAddress);}
      else throw new Error("Unknown role");

      await tx.wait();
      setStatus(`Success: Granted ${roleType} role to ${targetAddress.substring(0,6)}...`);
      setTargetAddress("");
    } catch (error) {
      console.error(error);
      setStatus("Error: Action failed. Ensure you are the contract owner and transaction was approved.");
    }
  };

  const handleRevokeRole = async (roleType) => {
    if (!targetAddress) return alert("Please enter a wallet address");
    if (!isValidAddress(targetAddress)) return alert("Invalid Ethereum address");
    setStatus("Processing...");

    try {
      const { contractWithSigner, signer, contract } = await connectBlockchain();
      const txContract = contractWithSigner ?? (signer ? contract.connect(signer) : null);
      if (!txContract) {
        setStatus("");
        return alert("No signer available. Connect MetaMask and unlock an account.");
      }

      let tx;
      if (roleType === 'producer') {tx = await txContract.revokeProducerRole(targetAddress);} 
      else if (roleType === 'slaughter') {tx = await txContract.revokeSlaughterhouseRole(targetAddress);} 
      else if (roleType === 'authority') {tx = await txContract.revokeHalalAuthorityRole(targetAddress);} 
      else if (roleType === 'distributor') {tx = await txContract.revokeDistributorRole(targetAddress);} 
      else if (roleType === 'retailer') {tx = await txContract.revokeRetailerRole(targetAddress);} 
      else throw new Error("Unknown role");

      await tx.wait();
      setStatus(`Success: Revoked ${roleType} role from ${targetAddress.substring(0,6)}...`);
      setTargetAddress("");
    } catch (error) {
      console.error(error);
      setStatus("Error: Action failed. Ensure you are the contract owner and transaction was approved.");
    }
  };

  const processing = status === "Processing...";

  return (
    <div className="glass-card wide">
      <h1 className="card-title">Admin Control</h1>
      <p className="card-subtitle">Authorize Supply Chain Participants</p>

      <div className="form-group">
        <label className="input-label">Target Wallet Address</label>
        <input 
          type="text" 
          className="glass-input" 
          placeholder="0x..." 
          value={targetAddress}
          onChange={(e) => setTargetAddress(e.target.value)}
        />

        <div className="action-stack">
          <div className="role-pair">
            <button className="primary-btn" onClick={() => handleGrantRole('producer')} disabled={processing}>
              Grant Producer Role
            </button>
            <button className="revoke-btn" onClick={() => handleRevokeRole('producer')} disabled={processing}>
              Revoke
            </button>
          </div>

          <div className="role-pair">
            <button className="primary-btn" onClick={() => handleGrantRole('slaughter')} disabled={processing}>
              Grant Slaughterhouse Role
            </button>
            <button className="revoke-btn" onClick={() => handleRevokeRole('slaughter')} disabled={processing}>
              Revoke
            </button>
          </div>

          <div className="role-pair">
            <button className="primary-btn" onClick={() => handleGrantRole('authority')} disabled={processing}>
              Grant Halal Authority
            </button>
            <button className="revoke-btn" onClick={() => handleRevokeRole('authority')} disabled={processing}>
              Revoke
            </button>
          </div>

          <div className="role-pair">
            <button className="primary-btn" onClick={() => handleGrantRole('distributor')} disabled={processing}>
              Grant Distributor Role
            </button>
            <button className="revoke-btn" onClick={() => handleRevokeRole('distributor')} disabled={processing}>
              Revoke
            </button>
          </div>

          <div className="role-pair">
            <button className="primary-btn" onClick={() => handleGrantRole('retailer')} disabled={processing}>
              Grant Retailer Role
            </button>
            <button className="revoke-btn" onClick={() => handleRevokeRole('retailer')} disabled={processing}>
              Revoke
            </button>
          </div>
        </div>
      </div>

      {status && <p className="status-text">{status}</p>}

      <button className="secondary-btn logout-btn" onClick={logout} disabled={processing}>
        Logout / Switch Account
      </button>
    </div>
  );
}