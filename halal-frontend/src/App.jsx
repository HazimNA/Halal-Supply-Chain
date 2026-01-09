import React, { useState, useEffect } from "react";
import { connectBlockchain } from "./blockchain/shared";
import Login from "./pages/login";
import Admin from "./pages/admin";
import Producer from "./pages/producer";
import Slaughterhouse from "./pages/slaughterhouse";
import HalalAuthority from "./pages/HalalAuthority";
import LogisticsPortal from "./pages/distributor_and_retailer"; // Distributor & Retailer
import Public from "./pages/public";
import "./App.css";

function App() {
  const [role, setRole] = useState(null); // null = Login Screen
  const [account, setAccount] = useState("");

  const handleLogin = async () => {
    try {
      // 1. Trigger MetaMask Popup
      const { contract, address } = await connectBlockchain();
      setAccount(address);

      // 2. Check Admin
      const adminAddr = await contract.admin();
      if (address.toLowerCase() === adminAddr.toLowerCase()) {
        setRole("ADMIN");
        return;
      }

      // 3. Check Other Roles
      // Important: Use .toLowerCase() for reliable comparison
      if (await contract.isProducer(address)) {
        setRole("PRODUCER");
      } else if (await contract.isSlaughterhouse(address)) {
        setRole("SLAUGHTERHOUSE");
      } else if (await contract.isHalalAuthority(address)) {
        setRole("AUTHORITY");
      } else if (await contract.isDistributor(address)) {
        setRole("DISTRIBUTOR");
      } else if (await contract.isRetailer(address)) {
        setRole("RETAILER");
      } else {
        // Only if NO roles are found, go to Public
        setRole("GUEST");
      }
    } catch (err) {
      console.error("Login failed:", err);
      alert("Please unlock MetaMask and connect your account.");
    }
  };

  const logout = () => {
    setRole(null);
    setAccount("");
  };

  // --- ROUTING LOGIC ---
  // This ensures the page only changes AFTER a role is set
    return (
    <div className="App">
      {!role ? (
        /* Change this line to pass setRole as a prop */
        <Login setRole={setRole} /> 
      ) : (
        <>
          {role === "ADMIN" && <Admin logout={logout} />}
          {role === "PRODUCER" && <Producer logout={logout} />}
          {role === "SLAUGHTERHOUSE" && <Slaughterhouse logout={logout} />}
          {role === "AUTHORITY" && <HalalAuthority logout={logout} />}
          {role === "DISTRIBUTOR" && <LogisticsPortal role="Distributor" logout={logout} />}
          {role === "RETAILER" && <LogisticsPortal role="Retailer" logout={logout} />}
          {/* Change "GUEST" to "PUBLIC" to match your Login.jsx logic */}
          {role === "PUBLIC" && <Public logout={logout} />}
        </>
      )}
    </div>
  );
}

export default App;