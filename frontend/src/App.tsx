import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import BookingPage from './pages/BookingPage';
import MyAppointments from './pages/MyAppointments';
import './App.css';

function App() {
  return (
    <AppProvider>
      <Router>
        <div className="App">
          {/* Navigation Bar */}
          <nav className="navbar">
            <div className="nav-container">
              <h1 className="logo">🏥 Doctor Appointment System</h1>
              <div className="nav-links">
                <Link to="/" className="nav-link">Home</Link>
                <Link to="/admin" className="nav-link">Admin</Link>
                <Link to="/my-appointments" className="nav-link">My Appointments</Link>
              </div>
            </div>
          </nav>

          {/* Page Routes */}
          <div className="content">
            <Routes>
              <Route path="/" element={<UserDashboard />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/booking/:doctorId" element={<BookingPage />} />
              <Route path="/my-appointments" element={<MyAppointments />} />
            </Routes>
          </div>
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;