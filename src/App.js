import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import ClinicManagementSystem from './components/ClinicManagementSystem';
import RoomsPage from './components/RoomsPage';

function App() {
  return (
    <Router>
      <div className="App">
        <nav>
          <ul>
            <li>
              <Link to="/">Management System</Link>
            </li>
            <li>
              <Link to="/rooms">Rooms Information</Link>
            </li>
          </ul>
        </nav>

        <Routes>
          <Route path="/" element={<ClinicManagementSystem />} />
          <Route path="/rooms" element={<RoomsPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;