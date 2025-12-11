import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { getDoctorById, getAvailableSlots, bookAppointment } from '../services/api';

interface Doctor {
  id: number;
  name: string;
  specialty: string;
  consultation_fee: number;
}

interface Slot {
  id: number;
  slot_date: string;
  start_time: string;
  end_time: string;
}

const BookingPage: React.FC = () => {
  const { doctorId } = useParams<{ doctorId: string }>();
  const navigate = useNavigate();
  const { patientEmail, setPatientEmail, setLoading } = useAppContext();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [step, setStep] = useState(1); // 1: Select slot, 2: Fill details
  
  // Form state
  const [formData, setFormData] = useState({
    patient_name: '',
    patient_email: patientEmail,
    patient_phone: '',
    patient_age: '',
    reason_for_visit: ''
  });

  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState('');

  useEffect(() => {
    loadDoctorAndSlots();
  }, [doctorId]);

  const loadDoctorAndSlots = async () => {
    try {
      setLoading(true);
      
      // Load doctor details
      const doctorResponse = await getDoctorById(parseInt(doctorId!));
      setDoctor(doctorResponse.data);

      // Load available slots
      const slotsResponse = await getAvailableSlots(parseInt(doctorId!));
      setSlots(slotsResponse.data);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setBookingError('Failed to load doctor information');
    } finally {
      setLoading(false);
    }
  };

  const handleSlotSelect = (slot: Slot) => {
    setSelectedSlot(slot);
    setStep(2);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSlot) {
      setBookingError('Please select a time slot');
      return;
    }

    try {
      setLoading(true);
      setBookingError('');

      await bookAppointment({
        slot_id: selectedSlot.id,
        patient_name: formData.patient_name,
        patient_email: formData.patient_email,
        patient_phone: formData.patient_phone,
        patient_age: parseInt(formData.patient_age),
        reason_for_visit: formData.reason_for_visit
      });

      // Save email for future bookings
      setPatientEmail(formData.patient_email);

      setBookingSuccess(true);
      
      // Redirect after 3 seconds
      setTimeout(() => {
        navigate('/my-appointments');
      }, 3000);
    } catch (err: any) {
      setBookingError(err.response?.data?.message || 'Booking failed. Slot might be already booked.');
    } finally {
      setLoading(false);
    }
  };

  // Group slots by date
  const groupedSlots = slots.reduce((acc: any, slot) => {
    const date = slot.slot_date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(slot);
    return acc;
  }, {});

  if (bookingSuccess) {
    return (
      <div className="booking-success">
        <div className="success-card">
          <div className="success-icon">✅</div>
          <h2>Appointment Booked Successfully!</h2>
          <p>Your appointment with {doctor?.name} has been booked.</p>
          <p className="redirect-text">Redirecting to My Appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-page">
      {/* Doctor Info */}
      {doctor && (
        <div className="doctor-header">
          <div className="doctor-avatar-large">
            {doctor.name.charAt(0)}
          </div>
          <div>
            <h2>{doctor.name}</h2>
            <p className="specialty">{doctor.specialty}</p>
            <p className="fee">₹{doctor.consultation_fee} / consultation</p>
          </div>
        </div>
      )}

      {/* Steps Indicator */}
      <div className="steps-indicator">
        <div className={`step ${step >= 1 ? 'active' : ''}`}>
          <span className="step-number">1</span>
          <span>Select Slot</span>
        </div>
        <div className={`step ${step >= 2 ? 'active' : ''}`}>
          <span className="step-number">2</span>
          <span>Enter Details</span>
        </div>
      </div>

      {bookingError && (
        <div className="error-message">{bookingError}</div>
      )}

      {/* Step 1: Select Slot */}
      {step === 1 && (
        <div className="slots-section">
          <h3>📅 Available Time Slots</h3>
          
          {Object.keys(groupedSlots).length === 0 ? (
            <div className="no-slots">
              <p>No available slots for this doctor.</p>
              <button onClick={() => navigate('/')} className="btn-secondary">
                Go Back
              </button>
            </div>
          ) : (
            Object.entries(groupedSlots).map(([date, dateSlots]: [string, any]) => (
              <div key={date} className="date-group">
                <h4 className="date-header">
                  {new Date(date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h4>
                <div className="slots-grid">
                  {dateSlots.map((slot: Slot) => (
                    <button
                      key={slot.id}
                      onClick={() => handleSlotSelect(slot)}
                      className="slot-button"
                    >
                      {slot.start_time} - {slot.end_time}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Step 2: Patient Details Form */}
      {step === 2 && selectedSlot && (
        <div className="booking-form-section">
          <div className="selected-slot-info">
            <h3>Selected Slot</h3>
            <p>📅 {new Date(selectedSlot.slot_date).toLocaleDateString()}</p>
            <p>🕐 {selectedSlot.start_time} - {selectedSlot.end_time}</p>
            <button onClick={() => setStep(1)} className="btn-change">
              Change Slot
            </button>
          </div>

          <form onSubmit={handleSubmit} className="booking-form">
            <h3>Patient Information</h3>

            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                name="patient_name"
                value={formData.patient_name}
                onChange={handleFormChange}
                required
                placeholder="John Doe"
              />
            </div>

            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                name="patient_email"
                value={formData.patient_email}
                onChange={handleFormChange}
                required
                placeholder="john@example.com"
              />
            </div>

            <div className="form-group">
              <label>Phone Number *</label>
              <input
                type="tel"
                name="patient_phone"
                value={formData.patient_phone}
                onChange={handleFormChange}
                required
                placeholder="+1234567890"
              />
            </div>

            <div className="form-group">
              <label>Age *</label>
              <input
                type="number"
                name="patient_age"
                value={formData.patient_age}
                onChange={handleFormChange}
                required
                min="1"
                max="120"
                placeholder="25"
              />
            </div>

            <div className="form-group">
              <label>Reason for Visit *</label>
              <textarea
                name="reason_for_visit"
                value={formData.reason_for_visit}
                onChange={handleFormChange}
                required
                rows={4}
                placeholder="Describe your symptoms or reason for consultation..."
              />
            </div>

            <div className="form-actions">
              <button type="button" onClick={() => setStep(1)} className="btn-secondary">
                Back
              </button>
              <button type="submit" className="btn-primary">
                Confirm Booking
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default BookingPage;