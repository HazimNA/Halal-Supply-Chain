import React, { useState } from 'react';
import Login from './pages/login';
import Admin from './pages/admin';
import Producer from './pages/producer';
import Slaughterhouse from './pages/slaughterhouse';
import Authority from './pages/HalalAuthority';
import Distributor from './pages/distributor';
import Retailer from './pages/retailer';
import Public from './pages/public';
import './App.css';

function App() {
  const [role, setRole] = useState(null);

  const logout = () => setRole(null);

  return (
    <div className="App">
      {!role && <Login setRole={setRole} />}
      {role === "ADMIN" && <Admin logout={logout} />}
      {role === "PRODUCER" && <Producer logout={logout} />}
      {role === "SLAUGHTERHOUSE" && <Slaughterhouse logout={logout} />}
      {role === "AUTHORITY" && <Authority logout={logout} />}
      {role === "DISTRIBUTOR" && <Distributor logout={logout} />}
      {role === "RETAILER" && <Retailer logout={logout} />}
      {role === "PUBLIC" && <Public logout={logout} />}
    </div>
  );
}

export default App;