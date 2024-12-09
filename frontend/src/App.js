import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import ClientDashboard from './components/ClientDashboard';
import Login from './components/Login';
import DavidDashboard from './components/DavidDashboard';
import Registration from './components/Registration';

function App() {
  return (
    <Router>
      <Routes>
      <Route path="/Login" element={<Login/>} />
        <Route path="/ClientDashboard" element={<ClientDashboard/>} />
        <Route path="/DavidDashboard" element={<DavidDashboard/>} />
        <Route path="/Registration" element={<Registration/>} />
      </Routes>
    </Router>
  );
}

export default App;
