import React, { useState } from "react";
import Login from "./pages/login";
import Admin from "./pages/admin";
import Producer from "./pages/producer";
import Slaughterhouse from "./pages/slaughterhouse";
import HalalAuthority from "./pages/HalalAuthority";
import LogisticsPortal from "./pages/distributor";
import Public from "./pages/public";
import Retailer from "./pages/retailer";
import "./App.css";

function App() {
  const [role, setRole] = useState(null); // null shows Login

  const logout = () => {
    setRole(null);
  };

  return (
    <div className="App">
      {!role ? (
        <Login setRole={setRole} />
      ) : (
        <>
          {role === "ADMIN" && <Admin logout={logout} />}
          {role === "PRODUCER" && <Producer logout={logout} />}
          {role === "SLAUGHTERHOUSE" && <Slaughterhouse logout={logout} />}
          {role === "AUTHORITY" && <HalalAuthority logout={logout} />}
          {role === "DISTRIBUTOR" && <LogisticsPortal role="Distributor" logout={logout} />}
          {role === "RETAILER" && <Retailer role="Retailer" logout={logout} />}
          {role === "PUBLIC" && <Public logout={logout} />}
        </>
      )}
    </div>
  );
}

export default App;