import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { getAppointments, confirmAppointment, cancelAppointment } from '../services/api';

interface Appointment {
  id: number;
  patient_name: string;
  patient_email: string;
  patient_phone: string;
  reason_for_visit: string;
  status: string;
  booking_time: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  doctor_name: string;
  specialty: string;
  consultation_fee: number;
}

const MyAppointments: React.FC = () => {
  const { patientEmail, setPatientEmail, setLoading } = useAppContext();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [emailInput, setEmailInput] = useState(patientEmail);
  const [showEmailPrompt, setShowEmailPrompt] = useState(!patientEmail);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (patientEmail) {
      loadAppointments();
    }
  }, [patientEmail]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const response = await getAppointments(patientEmail);
      setAppointments(response.data);
    } catch (err: any) {
      console.error('Error loading appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPatientEmail(emailInput);
    setShowEmailPrompt(false);
  };

  const handleConfirm = async (appointmentId: number) => {
    if (!window.confirm('Confirm this appointment?')) return;

    try {
      setLoading(true);
      await confirmAppointment(appointmentId);
      setMessage('Appointment confirmed successfully!');
      loadAppointments();
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error confirming appointment');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (appointmentId: number) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;

    try {
      setLoading(true);
      await cancelAppointment(appointmentId);
      setMessage('Appointment cancelled successfully');
      loadAppointments();
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error cancelling appointment');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'status-confirmed';
      case 'PENDING': return 'status-pending';
      case 'CANCELLED': return 'status-cancelled';
      case 'FAILED': return 'status-failed';
      default: return '';
    }
  };

  if (showEmailPrompt) {
    return (
      <div className="email-prompt">
        <div className="prompt-card">
          <h2>Enter Your Email</h2>
          <p>Please enter your email to view your appointments</p>
          <form onSubmit={handleEmailSubmit}>
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="your.email@example.com"
              required
              className="email-input"
            />
            <button type="submit" className="btn-primary">
              View My Appointments
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="my-appointments">
      <div className="appointments-header">
        <h1>📋 My Appointments</h1>
        <p className="email-display">
          Showing appointments for: <strong>{patientEmail}</strong>
          <button
            onClick={() => setShowEmailPrompt(true)}
            className="btn-change-email"
          >
            Change Email
          </button>
        </p>
      </div>

      {message && (
        <div className="success-message">{message}</div>
      )}

      {appointments.length === 0 ? (
        <div className="no-appointments">
          <div className="empty-state">
            <h3>No appointments found</h3>
            <p>You haven't booked any appointments yet.</p>
            <button onClick={() => window.location.href = '/'} className="btn-primary">
              Book an Appointment
            </button>
          </div>
        </div>
      ) : (
        <div className="appointments-list">
          {appointments.map((appointment) => (
            <div key={appointment.id} className="appointment-card">
              <div className="appointment-header-section">
                <div className="doctor-info-section">
                  <h3>{appointment.doctor_name}</h3>
                  <p className="specialty">{appointment.specialty}</p>
                </div>
                <span className={`status-badge ${getStatusColor(appointment.status)}`}>
                  {appointment.status}
                </span>
              </div>

              <div className="appointment-details">
                <div className="detail-row">
                  <span className="label">📅 Date:</span>
                  <span className="value">
                    {new Date(appointment.slot_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>

                <div className="detail-row">
                  <span className="label">🕐 Time:</span>
                  <span className="value">
                    {appointment.start_time} - {appointment.end_time}
                  </span>
                </div>

                <div className="detail-row">
                  <span className="label">👤 Patient:</span>
                  <span className="value">{appointment.patient_name}</span>
                </div>

                <div className="detail-row">
                  <span className="label">📞 Phone:</span>
                  <span className="value">{appointment.patient_phone}</span>
                </div>

                <div className="detail-row">
                  <span className="label">💰 Fee:</span>
                  <span className="value">₹{appointment.consultation_fee}</span>
                </div>

                <div className="detail-row">
                  <span className="label">📝 Reason:</span>
                  <span className="value">{appointment.reason_for_visit}</span>
                </div>

                <div className="detail-row">
                  <span className="label">🕒 Booked:</span>
                  <span className="value">
                    {new Date(appointment.booking_time).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="appointment-actions">
                {appointment.status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => handleConfirm(appointment.id)}
                      className="btn-confirm"
                    >
                      ✓ Confirm Appointment
                    </button>
                    <button
                      onClick={() => handleCancel(appointment.id)}
                      className="btn-cancel"
                    >
                      ✕ Cancel
                    </button>
                  </>
                )}
                
                {appointment.status === 'CONFIRMED' && (
                  <button
                    onClick={() => handleCancel(appointment.id)}
                    className="btn-cancel"
                  >
                    ✕ Cancel Appointment
                  </button>
                )}

                {appointment.status === 'FAILED' && (
                  <div className="failed-message">
                    ⚠️ This appointment expired after 2 minutes without confirmation
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyAppointments;