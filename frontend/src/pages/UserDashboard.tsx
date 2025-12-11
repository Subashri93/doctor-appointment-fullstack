import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { getAllDoctors } from '../services/api';

const UserDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { doctors, setDoctors, loading, setLoading, error, setError } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      setLoading(true);
      const response = await getAllDoctors();
      setDoctors(response.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get unique specialties
  const specialties = Array.from(new Set(doctors.map(d => d.specialty)));

  // Filter doctors
  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialty = selectedSpecialty === '' || doctor.specialty === selectedSpecialty;
    return matchesSearch && matchesSpecialty;
  });

  const handleBookAppointment = (doctorId: number) => {
    navigate(`/booking/${doctorId}`);
  };

  return (
    <div className="user-dashboard">
      <div className="hero-section">
        <h1>🏥 Find Your Doctor</h1>
        <p>Book appointments with top healthcare professionals</p>
      </div>

      {/* Search and Filter */}
      <div className="search-filter-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search doctors by name or specialty..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-box">
          <select
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            className="filter-select"
          >
            <option value="">All Specialties</option>
            {specialties.map(specialty => (
              <option key={specialty} value={specialty}>{specialty}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="loading">Loading doctors...</div>
      )}

      {/* Error State */}
      {error && (
        <div className="error-message">{error}</div>
      )}

      {/* Doctors Grid */}
      {!loading && (
        <div className="doctors-grid">
          {filteredDoctors.length === 0 ? (
            <div className="no-results">
              <p>No doctors found. Contact admin to add doctors.</p>
            </div>
          ) : (
            filteredDoctors.map((doctor) => (
              <div key={doctor.id} className="doctor-card">
                <div className="doctor-avatar">
                  {doctor.name.charAt(0)}
                </div>
                <div className="doctor-info">
                  <h3>{doctor.name}</h3>
                  <p className="specialty">{doctor.specialty}</p>
                  <p className="fee">₹{doctor.consultation_fee} / consultation</p>
                  <p className="email">{doctor.email}</p>
                </div>
                <button
                  onClick={() => handleBookAppointment(doctor.id)}
                  className="btn-book"
                >
                  Book Appointment
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Quick Info */}
      <div className="info-section">
        <div className="info-card">
          <h3>📅 Easy Booking</h3>
          <p>Select a doctor and choose your preferred time slot</p>
        </div>
        <div className="info-card">
          <h3>⏱️ Quick Process</h3>
          <p>Get confirmation within 2 minutes</p>
        </div>
        <div className="info-card">
          <h3>🔒 Secure</h3>
          <p>Your data is safe and encrypted</p>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;