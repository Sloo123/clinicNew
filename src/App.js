import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import ClinicManagementSystem from './components/ClinicManagementSystem';
import RoomsPage from './components/RoomsPage';
import DoctorCard from './components/DoctorCard';

function App() {
  return (
    <Router>
      <div className="App">

        <Routes>
          <Route path="/" element={<ClinicManagementSystem />} />
          <Route path="/rooms" element={<RoomsPage />} />
          <Route path="/room/:roomNumber" element={<DoctorCard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;