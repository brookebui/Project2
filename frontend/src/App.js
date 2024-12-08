import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import ClientDashboard from './components/ClientDashboard';
import Login from './components/Login';
import David from './components/DavidDashboard';
import Registration from './components/Registration';

function App() {
  return (
    <Router>
      <Routes>
      <Route path="/" element={<Login/>} />
        <Route path="/client" element={<ClientDashboard/>} />
        {/* <Route path="/david" element={<DavidDashboard/>} /> */}
        <Route path="/Registration" element={<Registration/>} />
      </Routes>
    </Router>
  );
}

export default App;
