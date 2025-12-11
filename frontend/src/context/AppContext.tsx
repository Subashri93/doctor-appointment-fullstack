import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define Types
interface Doctor {
  id: number;
  name: string;
  email: string;
  specialty: string;
  consultation_fee: number;
}

interface Slot {
  id: number;
  doctor_id: number;
  slot_date: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
  doctor_name?: string;
  specialty?: string;
}

interface Appointment {
  id: number;
  slot_id: number;
  patient_name: string;
  patient_email: string;
  patient_phone: string;
  patient_age: number;
  reason_for_visit: string;
  status: string;
  booking_time: string;
  slot_date?: string;
  start_time?: string;
  doctor_name?: string;
}

interface AppContextType {
  // State
  doctors: Doctor[];
  slots: Slot[];
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
  
  // User info
  patientEmail: string;
  setPatientEmail: (email: string) => void;
  
  // Functions
  setDoctors: (doctors: Doctor[]) => void;
  setSlots: (slots: Slot[]) => void;
  setAppointments: (appointments: Appointment[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

// Create Context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider Component
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patientEmail, setPatientEmail] = useState<string>(
    localStorage.getItem('patientEmail') || ''
  );

  // Save email to localStorage when it changes
  const handleSetPatientEmail = (email: string) => {
    setPatientEmail(email);
    localStorage.setItem('patientEmail', email);
  };

  return (
    <AppContext.Provider
      value={{
        doctors,
        slots,
        appointments,
        loading,
        error,
        patientEmail,
        setPatientEmail: handleSetPatientEmail,
        setDoctors,
        setSlots,
        setAppointments,
        setLoading,
        setError,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// Custom Hook to use context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};