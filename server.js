const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const DAYS = ['sunday','Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const app = express();
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid'); 

const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const DOCTORS_FILE = path.join(__dirname, 'doctors.json');
const ROOMS_FILE = path.join(__dirname, 'rooms.json');
const SECRET_KEY = 'secret-key';
const users = [
  { id: 1, username: 'admin', password: 'admin' }
];
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Ensure files exist
async function ensureFile(filePath) {
  try {
    await fs.access(filePath);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.writeFile(filePath, '[]');
      console.log(`Created ${path.basename(filePath)} file`);
    } else {
      throw error;
    }
  }
}
// Login endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  const user = users.find(u => u.username === username && u.password === password);
  
  if (user) {
    const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid username or password' });
  }
});

// Middleware to verify token
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  
  if (!token) {
    return res.status(403).json({ error: 'No token provided' });
  }
  
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    req.userId = decoded.id;
    next();
  });
};
// Endpoint to get all doctors
app.get('/api/doctors', async (req, res) => {
  try {
    await ensureFile(DOCTORS_FILE);
    const data = await fs.readFile(DOCTORS_FILE, 'utf8');
    const doctors = JSON.parse(data);
    res.json(doctors);
  } catch (error) {
    console.error('Error in /api/doctors endpoint:', error);
    if (error instanceof SyntaxError) {
      console.error('JSON parsing error:', error.message);
      res.status(500).json({ error: 'Error parsing doctors data' });
    } else if (error.code === 'ENOENT') {
      console.error('Doctors file not found:', DOCTORS_FILE);
      res.status(500).json({ error: 'Doctors data not available' });
    } else {
      console.error('Unexpected error:', error.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});
// Get a doctor by room number
app.get('/api/room/:roomNumber', async (req, res) => {
  const { roomNumber } = req.params;
  const currentTime = new Date();
  const currentDay = currentTime.toLocaleString('en-US', { weekday: 'long' });
  const currentTimeString = currentTime.toTimeString().split(' ')[0];

  try {
    // Ensure the rooms file exists
    await ensureFile(ROOMS_FILE);
    const schedulesData = await fs.readFile(ROOMS_FILE, 'utf8');
    const schedules = JSON.parse(schedulesData);

    const schedule = schedules.find(sch =>
      sch.number == roomNumber &&
      sch.schedule.some(app =>
        app.day === currentDay &&
        (
          (app.fromTime <= currentTimeString && app.toTime > currentTimeString) ||
          (app.toTime === "00:00" && currentTimeString >= app.fromTime)
        )
      )
    );

    if (schedule) {
      const currentAppointment = schedule.schedule.find(app =>
        app.day === currentDay &&
        (
          (app.fromTime <= currentTimeString && app.toTime > currentTimeString) ||
          (app.toTime === "00:00" && currentTimeString >= app.fromTime)
        )
      );

      // Ensure the doctors file exists
      await ensureFile(DOCTORS_FILE);
      const doctorsData = await fs.readFile(DOCTORS_FILE, 'utf8');
      const doctors = JSON.parse(doctorsData);

      const doctor = doctors.find(doc => doc.name === currentAppointment.name && doc.specialty === currentAppointment.specialty);

      if (doctor) {
        res.json({
          name: doctor.name,
          specialty: doctor.specialty,
          fromTime: currentAppointment.fromTime,
          toTime: currentAppointment.toTime
        });
      } else {
        res.status(404).json({ error: 'Doctor not found for this schedule' });
      }
    } else {
      res.status(404).json({ error: 'No schedule found for room ' + roomNumber });
    }
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// Endpoint to add a new doctor
app.post('/api/doctors', async (req, res) => {
  try {
    await ensureFile(DOCTORS_FILE);
    const { name, specialty } = req.body;
    const data = await fs.readFile(DOCTORS_FILE, 'utf8');
    const doctors = JSON.parse(data);

    if (!doctors.some(d => d.name === name && d.specialty === specialty)) {
      const id = uuidv4();
      doctors.push({ id, name, specialty });
      await fs.writeFile(DOCTORS_FILE, JSON.stringify(doctors, null, 2));
    }

    res.status(201).json({ message: 'Doctor added successfully' });
  } catch (error) {
    console.error('Error adding doctor:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to get all rooms data
app.get('/api/rooms', async (req, res) => {
  try {
    await ensureFile(ROOMS_FILE);
    const data = await fs.readFile(ROOMS_FILE, 'utf8');
    const rooms = JSON.parse(data);
    res.json(rooms);
  } catch (error) {
    console.error('Error reading rooms file:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE route to remove a doctor
app.delete('/api/doctors', async (req, res) => {
  try {
    const { name, specialty } = req.body;
    let doctors = JSON.parse(await fs.readFile(DOCTORS_FILE, 'utf8'));
    doctors = doctors.filter(d => d.name !== name || d.specialty !== specialty);
    await fs.writeFile(DOCTORS_FILE, JSON.stringify(doctors, null, 2));
    res.json({ message: 'Doctor removed successfully' });
  } catch (error) {
    console.error('Error removing doctor:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT route to update a doctor
app.put('/api/doctors', async (req, res) => {
  try {
    const { oldName, oldSpecialty, newName, newSpecialty } = req.body;
    let doctors = JSON.parse(await fs.readFile(DOCTORS_FILE, 'utf8'));
    const index = doctors.findIndex(d => d.name === oldName && d.specialty === oldSpecialty);
    if (index !== -1) {
      doctors[index] = { name: newName, specialty: newSpecialty };
      await fs.writeFile(DOCTORS_FILE, JSON.stringify(doctors, null, 2));
      res.json({ message: 'Doctor updated successfully' });
    } else {
      res.status(404).json({ error: 'Doctor not found' });
    }
  } catch (error) {
    console.error('Error updating doctor:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to check for time conflicts
function hasTimeConflict(schedule, newAppointment) {
  if (!Array.isArray(schedule) || !newAppointment) return false;
  return schedule.some(appointment => {
    if (!appointment || appointment.day !== newAppointment.day) return false;
    const existingStart = appointment.fromTime;
    const existingEnd = appointment.toTime;
    const newStart = newAppointment.fromTime;
    const newEnd = newAppointment.toTime;
    if (!existingStart || !existingEnd || !newStart || !newEnd) return false;
    return (newStart < existingEnd && newEnd > existingStart);
  });
}

// Helper function to validate and format time
function validateAndFormatTime(time) {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(time)) {
    throw new Error(`Invalid time format: ${time}`);
  }
  return time.padStart(5, '0'); // Ensure HH:MM format
}

// Helper function to read rooms data
async function readRoomsData() {
  await ensureFile(ROOMS_FILE);
  const data = await fs.readFile(ROOMS_FILE, 'utf8');
  return JSON.parse(data);
}

// Helper function to write rooms data
async function writeRoomsData(rooms) {
  await fs.writeFile(ROOMS_FILE, JSON.stringify(rooms, null, 2));
}

// Endpoint to update room schedule
app.post('/api/rooms', async (req, res) => {
  try {
    const { room, day, fromTime, toTime, doctor, originalFromTime, originalToTime } = req.body;
    console.log('Received request:', { room, day, fromTime, toTime, doctor, originalFromTime, originalToTime });

    // Validate required fields
    if (!room || !day || !fromTime || !toTime) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let rooms = await readRoomsData();

    let updatedRoom = rooms.find(r => r.number === room);
    if (!updatedRoom) {
      // If the room doesn't exist, create it
      updatedRoom = { number: room, schedule: [] };
      rooms.push(updatedRoom);
    }

    if (doctor) {
      // Adding or updating a doctor
      const newAppointment = { day, fromTime, toTime, ...doctor };
      let existingIndex = -1;

      if (originalFromTime && originalToTime) {
        // We're updating an existing appointment
        existingIndex = updatedRoom.schedule.findIndex(s => 
          s.day === day && s.fromTime === originalFromTime && s.toTime === originalToTime
        );
      } else {
        // Check if we're adding a new appointment at the same time slot
        existingIndex = updatedRoom.schedule.findIndex(s => 
          s.day === day && s.fromTime === fromTime && s.toTime === toTime
        );
      }

      // Check for time conflicts, excluding the appointment being updated
      const hasConflict = updatedRoom.schedule.some((s, index) => 
        index !== existingIndex &&
        s.day === day && 
        ((fromTime >= s.fromTime && fromTime < s.toTime) || 
         (toTime > s.fromTime && toTime <= s.toTime) ||
         (fromTime <= s.fromTime && toTime >= s.toTime))
      );

      if (hasConflict) {
        return res.status(409).json({ error: 'Time conflict with existing appointment' });
      }

      if (existingIndex !== -1) {
        updatedRoom.schedule[existingIndex] = newAppointment;
      } else {
        updatedRoom.schedule.push(newAppointment);
      }
    } else {
      // Removing a doctor
      const initialLength = updatedRoom.schedule.length;
      updatedRoom.schedule = updatedRoom.schedule.filter(s => 
        !(s.day === day && s.fromTime === fromTime && s.toTime === toTime)
      );
      if (updatedRoom.schedule.length === initialLength) {
        return res.status(404).json({ error: 'Appointment not found' });
      }
    }

    // Sort schedule
    updatedRoom.schedule.sort((a, b) => {
      const dayCompare = a.day.localeCompare(b.day);
      return dayCompare !== 0 ? dayCompare : a.fromTime.localeCompare(b.fromTime);
    });

    await writeRoomsData(rooms);
    console.log('Updated room data:', updatedRoom);
    res.status(200).json({ message: 'Room schedule updated successfully' });
  } catch (error) {
    console.error('Error in /api/rooms endpoint:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server is running on port ${PORT}`);
});
