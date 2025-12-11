1. Context API State Management
typescript// AppContext.tsx provides global state
const { 
  doctors, 
  setDoctors, 
  loading, 
  patientEmail 
} = useAppContext();
Why Context API?

Avoids prop drilling
Centralized state
Easy to access from any component
No external dependencies needed

2. API Service Layer
typescript// api.ts handles all backend communication
import { getAllDoctors, bookAppointment } from './services/api';

const response = await getAllDoctors();
Benefits:

Centralized API logic
Easy to update backend URL
Consistent error handling
Type-safe with TypeScript

3. TypeScript Types
typescriptinterface Doctor {
  id: number;
  name: string;
  specialty: string;
  consultation_fee: number;
}
Advantages:

Type safety
Better IDE autocomplete
Catch errors during development
Self-documenting code

4. Component Structure
App.tsx (Router)
  ├── Navbar (Navigation)
  └── Routes
      ├── UserDashboard (Home)
      ├── AdminDashboard (Admin)
      ├── BookingPage (Booking)
      └── MyAppointments (History)

 Design Features
1. Responsive Design

Mobile-friendly
Grid layout adapts to screen size
Touch-friendly buttons

2. Modern UI

Gradient backgrounds
Smooth transitions
Card-based layout
Status badges with colors

3. User Experience

Loading states
Error messages
Success feedback
Empty states
Confirmation dialogs


Step 1: Setup Your Database (5 minutes)

Go to https://neon.tech
Click "Sign Up" (use your Google/GitHub account)
Click "Create Project"
Name it: doctor-appointments
IMPORTANT: Copy the connection string that looks like:

   postgresql://user:pass@ep-something.neon.tech/dbname

Save this somewhere safe!

Step 2: Setup Your Project (5 minutes)

Open Terminal/Command Prompt
Navigate to your backend folder:

bash   cd path/to/DOCTOR-APPOINTMENT-SYSTEM/backend

Install dependencies:

bash   npm install
This downloads all required packages (takes 1-2 minutes)
Step 3: Configure Your Database Connection (2 minutes)

Open the .env file in VS Code
Replace DATABASE_URL with your connection string from Step 1:

   DATABASE_URL=postgresql://your-actual-connection-string-here
   PORT=5000
   CORS_ORIGIN=http://localhost:3000

Save the file (Ctrl+S or Cmd+S)

Step 4: Start Your Backend! (1 minute)
Run this command:
bashnpm start
You should see:
 Database connected successfully!
 Database tables created successfully!
 Doctor Appointment System Backend
 Server running on: http://localhost:5000


 Test 1: Health Check
Open your browser and visit:
http://localhost:5000/health
You should see:
json{
  "success": true,
  "message": "Server is running!",
  "timestamp": "2024-12-11T..."
}
Test 2: Create a Doctor
Using Postman or Thunder Client:
POST http://localhost:5000/api/doctors
Body (JSON):
json{
  "name": "Dr. Sarah Johnson",
  "email": "sarah@hospital.com",
  "specialty": "Cardiologist",
  "consultation_fee": 500
}
Response:
json{
  "success": true,
  "message": "Doctor created successfully",
  "data": {
    "id": 1,
    "name": "Dr. Sarah Johnson",
    ...
  }
}
Test 3: Get All Doctors
GET http://localhost:5000/api/doctors
You should see the doctor you just created!
Test 4: Create Time Slots
POST http://localhost:5000/api/slots
Body:
json{
  "doctor_id": 1,
  "slot_date": "2025-01-15",
  "start_time": "10:00",
  "end_time": "10:30"
}
Test 5: Book an Appointment
POST http://localhost:5000/api/appointments
Body:
json{
  "slot_id": 1,
  "patient_name": "John Doe",
  "patient_email": "john@example.com",
  "patient_phone": "+1234567890",
  "patient_age": 35,
  "reason_for_visit": "Regular checkup"
}
Response:
json{
  "success": true,
  "message": "Appointment booked successfully!",
  "data": { ... }
}

📚 API ENDPOINTS REFERENCE
Doctors

POST /api/doctors - Create doctor
GET /api/doctors - Get all doctors
GET /api/doctors/:id - Get single doctor

Slots

POST /api/slots - Create time slot
GET /api/slots/available - Get available slots
GET /api/slots/available?doctor_id=1 - Get slots for specific doctor

Appointments

POST /api/appointments - Book appointment
POST /api/appointments/:id/confirm - Confirm appointment
POST /api/appointments/:id/cancel - Cancel appointment
GET /api/appointments - Get all appointments
GET /api/appointments?patient_email=john@example.com - Get patient's appointments

Dashboard

GET /api/dashboard/stats - Get system statistics


🔧 HOW IT WORKS (Technical Explanation)
1. Database Connection
javascriptconst pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

Pool creates a connection pool (reusable database connections)
connectionString tells it where your database is
ssl required for cloud databases

2. Creating Tables
javascriptawait pool.query(`
  CREATE TABLE IF NOT EXISTS doctors (...)
`);

Creates tables if they don't exist
Runs automatically when server starts

3. API Endpoints
javascriptapp.post('/api/doctors', async (req, res) => {
  const { name, email } = req.body;
  const result = await pool.query(
    'INSERT INTO doctors (name, email) VALUES ($1, $2) RETURNING *',
    [name, email]
  );
  res.json({ data: result.rows[0] });
});

app.post handles POST requests
req.body contains data sent from frontend
pool.query runs SQL commands
$1, $2 are placeholders (prevents SQL injection)
res.json sends response back

4. Preventing Double Booking (IMPORTANT!)
javascriptawait client.query('BEGIN'); // Start transaction

const slot = await client.query(
  'SELECT * FROM slots WHERE id = $1 FOR UPDATE',
  [slot_id]
);

if (slot.rows[0].is_booked) {
  await client.query('ROLLBACK'); // Cancel changes
  return res.status(409).json({ message: 'Already booked!' });
}

// Create appointment and mark slot as booked
await client.query('COMMIT'); // Save changes
How it prevents double booking:

BEGIN starts a transaction (all-or-nothing)
FOR UPDATE locks the slot (other users wait)
Check if already booked
If not booked, book it atomically
COMMIT saves everything

Why this works:

User A locks slot → User B waits → User A completes → Slot marked booked → User B checks and sees it's booked → User B gets error


🚀 DEPLOYMENT TO RENDER (20 Minutes)
Step 1: Push to GitHub

Create a new repository on GitHub
In your terminal:

bash   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_GITHUB_URL
   git push -u origin main
Step 2: Deploy Backend on Render

Go to https://render.com
Sign up with GitHub
Click "New +" → "Web Service"
Connect your GitHub repository
Fill in:

Name: doctor-appointment-backend
Environment: Node
Build Command: npm install
Start Command: npm start


Click "Environment Variables"
Add:

   DATABASE_URL = your-neon-connection-string
   PORT = 5000
   CORS_ORIGIN = *

Click "Create Web Service"
Wait 5 minutes for deployment
Copy your backend URL: https://doctor-appointment-backend.onrender.com
