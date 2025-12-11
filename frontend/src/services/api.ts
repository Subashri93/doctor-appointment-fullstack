import axios from 'axios';

// Change this to your deployed backend URL after deployment
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
fetch(`${API_URL}/api/appointments`)

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================
// DOCTOR APIs
// ============================================

export const createDoctor = async (doctorData: {
  name: string;
  email: string;
  specialty: string;
  consultation_fee: number;
}) => {
  const response = await api.post('/api/doctors', doctorData);
  return response.data;
};

export const getAllDoctors = async () => {
  const response = await api.get('/api/doctors');
  return response.data;
};

export const getDoctorById = async (id: number) => {
  const response = await api.get(`/api/doctors/${id}`);
  return response.data;
};

// ============================================
// SLOT APIs
// ============================================

export const createSlot = async (slotData: {
  doctor_id: number;
  slot_date: string;
  start_time: string;
  end_time: string;
}) => {
  const response = await api.post('/api/slots', slotData);
  return response.data;
};

export const getAvailableSlots = async (doctorId?: number) => {
  const url = doctorId 
    ? `/api/slots/available?doctor_id=${doctorId}`
    : '/api/slots/available';
  const response = await api.get(url);
  return response.data;
};

// ============================================
// APPOINTMENT APIs
// ============================================

export const bookAppointment = async (appointmentData: {
  slot_id: number;
  patient_name: string;
  patient_email: string;
  patient_phone: string;
  patient_age: number;
  reason_for_visit: string;
}) => {
  const response = await api.post('/api/appointments', appointmentData);
  return response.data;
};

export const confirmAppointment = async (appointmentId: number) => {
  const response = await api.post(`/api/appointments/${appointmentId}/confirm`);
  return response.data;
};

export const cancelAppointment = async (appointmentId: number) => {
  const response = await api.post(`/api/appointments/${appointmentId}/cancel`);
  return response.data;
};

export const getAppointments = async (patientEmail?: string) => {
  const url = patientEmail 
    ? `/api/appointments?patient_email=${patientEmail}`
    : '/api/appointments';
  const response = await api.get(url);
  return response.data;
};

// ============================================
// DASHBOARD APIs
// ============================================

export const getDashboardStats = async () => {
  const response = await api.get('/api/dashboard/stats');
  return response.data;
};

export default api;