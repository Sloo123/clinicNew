const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const DOCTORS_FILE = path.join(__dirname, 'doctors.json');
const ROOMS_FILE = path.join(__dirname, 'rooms.json');

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

// Endpoint to add a new doctor
app.post('/api/doctors', async (req, res) => {
  try {
    await ensureFile(DOCTORS_FILE);
    const { name, specialty } = req.body;
    const data = await fs.readFile(DOCTORS_FILE, 'utf8');
    const doctors = JSON.parse(data);

    if (!doctors.some(d => d.name === name && d.specialty === specialty)) {
      doctors.push({ name, specialty });
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
    const { room, day, fromTime, toTime, doctor } = req.body;
    console.log('Received request:', { room, day, fromTime, toTime, doctor });

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
      const existingIndex = updatedRoom.schedule.findIndex(s => 
        s.day === day && s.fromTime === fromTime && s.toTime === toTime
      );

      if (existingIndex === -1) {
        // Check for time conflicts
        const hasConflict = updatedRoom.schedule.some(s => 
          s.day === day && 
          ((fromTime >= s.fromTime && fromTime < s.toTime) || 
           (toTime > s.fromTime && toTime <= s.toTime) ||
           (fromTime <= s.fromTime && toTime >= s.toTime))
        );

        if (hasConflict) {
          return res.status(409).json({ error: 'Time conflict with existing appointment' });
        }

        updatedRoom.schedule.push(newAppointment);
      } else {
        updatedRoom.schedule[existingIndex] = newAppointment;
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
