// ============================================
// DOCTOR APPOINTMENT BOOKING SYSTEM - BACKEND
// ============================================
console.log('🔹 server.js is running...');


// Step 1: Import required packages
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

// Step 2: Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Step 3: Setup middleware (allows API to receive/send data)
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' })); // Allow frontend to connect
app.use(express.json()); // Parse JSON data

// Step 4: Connect to PostgreSQL Database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for cloud databases like Neon
  }
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection error:', err);
    process.exit(1);
  }
  console.log('✅ Database connected successfully!');
  release();
});

// ============================================
// STEP 5: CREATE DATABASE TABLES
// ============================================
const initializeDatabase = async () => {
  try {
    // Create doctors table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS doctors (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        specialty VARCHAR(100) NOT NULL,
        consultation_fee DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create slots table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS slots (
        id SERIAL PRIMARY KEY,
        doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
        slot_date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        is_booked BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(doctor_id, slot_date, start_time)
      )
    `);

    // Create appointments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id SERIAL PRIMARY KEY,
        slot_id INTEGER REFERENCES slots(id) ON DELETE CASCADE,
        patient_name VARCHAR(255) NOT NULL,
        patient_email VARCHAR(255) NOT NULL,
        patient_phone VARCHAR(20) NOT NULL,
        patient_age INTEGER NOT NULL,
        reason_for_visit TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'PENDING',
        booking_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        confirmation_time TIMESTAMP,
        CONSTRAINT valid_status CHECK (status IN ('PENDING', 'CONFIRMED', 'FAILED', 'CANCELLED'))
      )
    `);

    // Create indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_slots_doctor_date ON slots(doctor_id, slot_date);
      CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
    `);

    console.log('✅ Database tables created successfully!');
  } catch (error) {
    console.error('❌ Error creating tables:', error);
  }
};

// Initialize database on server start
initializeDatabase();

// ============================================
// API ENDPOINTS
// ============================================

// 🏥 HEALTH CHECK
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running!',
    timestamp: new Date()
  });
});

// ============================================
// DOCTOR ENDPOINTS
// ============================================

// CREATE DOCTOR (Admin)
app.post('/api/doctors', async (req, res) => {
  try {
    const { name, email, specialty, consultation_fee } = req.body;

    // Validate input
    if (!name || !email || !specialty || !consultation_fee) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Insert into database
    const result = await pool.query(
      'INSERT INTO doctors (name, email, specialty, consultation_fee) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email, specialty, consultation_fee]
    );

    res.status(201).json({
      success: true,
      message: 'Doctor created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error creating doctor',
      error: error.message
    });
  }
});

// GET ALL DOCTORS
app.get('/api/doctors', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM doctors ORDER BY name ASC'
    );

    res.json({
      success: true,
      message: 'Doctors retrieved successfully',
      data: result.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error fetching doctors'
    });
  }
});

// GET SINGLE DOCTOR
app.get('/api/doctors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM doctors WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching doctor' });
  }
});

// ============================================
// SLOT ENDPOINTS
// ============================================

// CREATE SLOTS (Admin)
app.post('/api/slots', async (req, res) => {
  try {
    const { doctor_id, slot_date, start_time, end_time } = req.body;

    if (!doctor_id || !slot_date || !start_time || !end_time) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    const result = await pool.query(
      'INSERT INTO slots (doctor_id, slot_date, start_time, end_time) VALUES ($1, $2, $3, $4) RETURNING *',
      [doctor_id, slot_date, start_time, end_time]
    );

    res.status(201).json({
      success: true,
      message: 'Slot created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error creating slot',
      error: error.message
    });
  }
});

// GET AVAILABLE SLOTS
app.get('/api/slots/available', async (req, res) => {
  try {
    const { doctor_id } = req.query;

    let query = `
      SELECT s.*, d.name as doctor_name, d.specialty, d.consultation_fee
      FROM slots s
      JOIN doctors d ON s.doctor_id = d.id
      WHERE s.is_booked = FALSE
      AND s.slot_date >= CURRENT_DATE
    `;
    const params = [];

    if (doctor_id) {
      query += ' AND s.doctor_id = $1';
      params.push(doctor_id);
    }

    query += ' ORDER BY s.slot_date ASC, s.start_time ASC';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      message: 'Available slots retrieved',
      data: result.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error fetching slots'
    });
  }
});

// ============================================
// APPOINTMENT ENDPOINTS (CONCURRENCY SAFE)
// ============================================

// BOOK APPOINTMENT
app.post('/api/appointments', async (req, res) => {
  const client = await pool.connect(); // Get dedicated connection for transaction

  try {
    const { slot_id, patient_name, patient_email, patient_phone, patient_age, reason_for_visit } = req.body;

    // Validate input
    if (!slot_id || !patient_name || !patient_email || !patient_phone || !patient_age || !reason_for_visit) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // START TRANSACTION (prevents double booking)
    await client.query('BEGIN');

    // STEP 1: Lock the slot (prevents other users from booking same slot)
    const slotCheck = await client.query(
      'SELECT * FROM slots WHERE id = $1 FOR UPDATE',
      [slot_id]
    );

    if (slotCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Slot not found'
      });
    }

    const slot = slotCheck.rows[0];

    // STEP 2: Check if slot is already booked
    if (slot.is_booked) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        message: 'Slot is already booked! Please select another slot.'
      });
    }

    // STEP 3: Create appointment
    const appointmentResult = await client.query(
      `INSERT INTO appointments 
       (slot_id, patient_name, patient_email, patient_phone, patient_age, reason_for_visit, status) 
       VALUES ($1, $2, $3, $4, $5, $6, 'PENDING') 
       RETURNING *`,
      [slot_id, patient_name, patient_email, patient_phone, patient_age, reason_for_visit]
    );

    // STEP 4: Mark slot as booked
    await client.query(
      'UPDATE slots SET is_booked = TRUE WHERE id = $1',
      [slot_id]
    );

    // COMMIT TRANSACTION (save all changes)
    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully!',
      data: appointmentResult.rows[0]
    });
  } catch (error) {
    // ROLLBACK on error (undo all changes)
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error booking appointment',
      error: error.message
    });
  } finally {
    client.release(); // Release connection back to pool
  }
});

// CONFIRM APPOINTMENT
app.post('/api/appointments/:id/confirm', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE appointments 
       SET status = 'CONFIRMED', confirmation_time = NOW() 
       WHERE id = $1 AND status = 'PENDING' 
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found or already processed'
      });
    }

    res.json({
      success: true,
      message: 'Appointment confirmed!',
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error confirming appointment' });
  }
});

// GET ALL APPOINTMENTS
app.get('/api/appointments', async (req, res) => {
  try {
    const { patient_email } = req.query;

    let query = `
      SELECT a.*, s.slot_date, s.start_time, s.end_time,
             d.name as doctor_name, d.specialty, d.consultation_fee
      FROM appointments a
      JOIN slots s ON a.slot_id = s.id
      JOIN doctors d ON s.doctor_id = d.id
    `;
    const params = [];

    if (patient_email) {
      query += ' WHERE a.patient_email = $1';
      params.push(patient_email);
    }

    query += ' ORDER BY a.booking_time DESC';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error fetching appointments' });
  }
});

// CANCEL APPOINTMENT
app.post('/api/appointments/:id/cancel', async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    await client.query('BEGIN');

    // Get appointment details
    const appointmentResult = await client.query(
      'SELECT * FROM appointments WHERE id = $1',
      [id]
    );

    if (appointmentResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    const appointment = appointmentResult.rows[0];

    // Update appointment status
    await client.query(
      "UPDATE appointments SET status = 'CANCELLED' WHERE id = $1",
      [id]
    );

    // Release the slot
    await client.query(
      'UPDATE slots SET is_booked = FALSE WHERE id = $1',
      [appointment.slot_id]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Appointment cancelled successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ success: false, message: 'Error cancelling appointment' });
  } finally {
    client.release();
  }
});

// ============================================
// DASHBOARD STATS (Admin)
// ============================================
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM doctors) as total_doctors,
        (SELECT COUNT(*) FROM slots WHERE is_booked = FALSE AND slot_date >= CURRENT_DATE) as available_slots,
        (SELECT COUNT(*) FROM appointments WHERE status = 'PENDING') as pending_appointments,
        (SELECT COUNT(*) FROM appointments WHERE status = 'CONFIRMED') as confirmed_appointments
    `);

    res.json({
      success: true,
      data: stats.rows[0]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching stats' });
  }
});

// ============================================
// AUTO-EXPIRE PENDING BOOKINGS (Background Job)
// ============================================
setInterval(async () => {
  try {
    const result = await pool.query(`
      WITH expired_appointments AS (
        UPDATE appointments
        SET status = 'FAILED'
        WHERE status = 'PENDING'
        AND booking_time < NOW() - INTERVAL '2 minutes'
        RETURNING slot_id
      )
      UPDATE slots
      SET is_booked = FALSE
      WHERE id IN (SELECT slot_id FROM expired_appointments)
    `);

    if (result.rowCount > 0) {
      console.log(`✅ Expired ${result.rowCount} pending bookings`);
    }
  } catch (error) {
    console.error('Error expiring bookings:', error);
  }
}, 60000); // Run every 1 minute

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
  console.log(`
   ========================================
   Doctor Appointment System Backend
   Server running on: http://localhost:${PORT}
   Health check: http://localhost:${PORT}/health
  ========================================
  `);
});

module.exports = app;