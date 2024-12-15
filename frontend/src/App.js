import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import ClientDashboard from './components/ClientDashboard';
import Login from './components/Login';
import DavidDashboard from './components/DavidDashboard';
import Registration from './components/Registration';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/Login" replace />} />
        
        <Route path="/Login" element={<Login />} />
        <Route path="/ClientDashboard" element={<ClientDashboard />} />
        <Route path="/DavidDashboard" element={<DavidDashboard />} />
        <Route path="/Registration" element={<Registration />} />
        
        <Route path="*" element={<Navigate to="/Login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
