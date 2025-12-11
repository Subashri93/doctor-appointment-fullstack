import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { createDoctor, getAllDoctors, createSlot, getDashboardStats } from '../services/api';

const AdminDashboard: React.FC = () => {
  const { doctors, setDoctors, setLoading, setError } = useAppContext();
  const [stats, setStats] = useState<any>(null);
  
  // Doctor Form State
  const [doctorForm, setDoctorForm] = useState({
    name: '',
    email: '',
    specialty: '',
    consultation_fee: ''
  });

  // Slot Form State
  const [slotForm, setSlotForm] = useState({
    doctor_id: '',
    slot_date: '',
    start_time: '',
    end_time: ''
  });

  const [successMessage, setSuccessMessage] = useState('');

  // Load data on mount
  useEffect(() => {
    loadDoctors();
    loadStats();
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

  const loadStats = async () => {
    try {
      const response = await getDashboardStats();
      setStats(response.data);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  // Handle Doctor Form Submit
  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await createDoctor({
        ...doctorForm,
        consultation_fee: parseFloat(doctorForm.consultation_fee)
      });
      
      setSuccessMessage('Doctor created successfully!');
      setDoctorForm({ name: '', email: '', specialty: '', consultation_fee: '' });
      loadDoctors();
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error creating doctor');
    } finally {
      setLoading(false);
    }
  };

  // Handle Slot Form Submit
  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await createSlot({
        ...slotForm,
        doctor_id: parseInt(slotForm.doctor_id)
      });
      
      setSuccessMessage('Slot created successfully!');
      setSlotForm({ doctor_id: '', slot_date: '', start_time: '', end_time: '' });
      loadStats();
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error creating slot');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-dashboard">
      <h1>🔧 Admin Dashboard</h1>

      {/* Success Message */}
      {successMessage && (
        <div className="success-message">{successMessage}</div>
      )}

      {/* Stats Section */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Doctors</h3>
            <p className="stat-number">{stats.total_doctors}</p>
          </div>
          <div className="stat-card">
            <h3>Available Slots</h3>
            <p className="stat-number">{stats.available_slots}</p>
          </div>
          <div className="stat-card">
            <h3>Pending Appointments</h3>
            <p className="stat-number">{stats.pending_appointments}</p>
          </div>
          <div className="stat-card">
            <h3>Confirmed Appointments</h3>
            <p className="stat-number">{stats.confirmed_appointments}</p>
          </div>
        </div>
      )}

      <div className="admin-forms">
        {/* Create Doctor Form */}
        <div className="form-section">
          <h2>➕ Create Doctor</h2>
          <form onSubmit={handleCreateDoctor}>
            <div className="form-group">
              <label>Doctor Name *</label>
              <input
                type="text"
                value={doctorForm.name}
                onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })}
                required
                placeholder="Dr. John Smith"
              />
            </div>

            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                value={doctorForm.email}
                onChange={(e) => setDoctorForm({ ...doctorForm, email: e.target.value })}
                required
                placeholder="doctor@hospital.com"
              />
            </div>

            <div className="form-group">
              <label>Specialty *</label>
              <select
                value={doctorForm.specialty}
                onChange={(e) => setDoctorForm({ ...doctorForm, specialty: e.target.value })}
                required
              >
                <option value="">Select Specialty</option>
                <option value="Cardiologist">Cardiologist</option>
                <option value="Dermatologist">Dermatologist</option>
                <option value="Pediatrician">Pediatrician</option>
                <option value="Orthopedic">Orthopedic</option>
                <option value="General Physician">General Physician</option>
                <option value="Dentist">Dentist</option>
              </select>
            </div>

            <div className="form-group">
              <label>Consultation Fee (₹) *</label>
              <input
                type="number"
                value={doctorForm.consultation_fee}
                onChange={(e) => setDoctorForm({ ...doctorForm, consultation_fee: e.target.value })}
                required
                min="0"
                placeholder="500"
              />
            </div>

            <button type="submit" className="btn-primary">
              Create Doctor
            </button>
          </form>
        </div>

        {/* Create Slot Form */}
        <div className="form-section">
          <h2>📅 Create Time Slot</h2>
          <form onSubmit={handleCreateSlot}>
            <div className="form-group">
              <label>Select Doctor *</label>
              <select
                value={slotForm.doctor_id}
                onChange={(e) => setSlotForm({ ...slotForm, doctor_id: e.target.value })}
                required
              >
                <option value="">Choose a doctor</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name} - {doctor.specialty}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Date *</label>
              <input
                type="date"
                value={slotForm.slot_date}
                onChange={(e) => setSlotForm({ ...slotForm, slot_date: e.target.value })}
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Start Time *</label>
                <input
                  type="time"
                  value={slotForm.start_time}
                  onChange={(e) => setSlotForm({ ...slotForm, start_time: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>End Time *</label>
                <input
                  type="time"
                  value={slotForm.end_time}
                  onChange={(e) => setSlotForm({ ...slotForm, end_time: e.target.value })}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-primary">
              Create Slot
            </button>
          </form>
        </div>
      </div>

      {/* Doctors List */}
      <div className="doctors-list">
        <h2>👨‍⚕️ All Doctors ({doctors.length})</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Specialty</th>
                <th>Email</th>
                <th>Fee</th>
              </tr>
            </thead>
            <tbody>
              {doctors.map((doctor) => (
                <tr key={doctor.id}>
                  <td>{doctor.name}</td>
                  <td>{doctor.specialty}</td>
                  <td>{doctor.email}</td>
                  <td>₹{doctor.consultation_fee}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;