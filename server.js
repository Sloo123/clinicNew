const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const DOCTORS_FILE = path.join(__dirname, 'doctors.json');
const ROOMS_FILE = path.join(__dirname, 'rooms.json');

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
    console.error('Error reading doctors file:', error);
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

// Endpoint to update room schedule
app.post('/api/rooms', async (req, res) => {
  try {
    await ensureFile(ROOMS_FILE);
    const { room, day, fromTime, toTime, doctor } = req.body;
    let rooms = [];
    
    const data = await fs.readFile(ROOMS_FILE, 'utf8');
    rooms = JSON.parse(data);

    const roomIndex = rooms.findIndex(r => r.number === room);
    if (roomIndex === -1) {
      rooms.push({ number: room, schedule: [] });
    }

    const updatedRoom = rooms.find(r => r.number === room);
    const scheduleIndex = updatedRoom.schedule.findIndex(s => s.day === day && s.fromTime === fromTime && s.toTime === toTime);

    if (doctor) {
      // Adding or updating a doctor
      if (scheduleIndex === -1) {
        updatedRoom.schedule.push({ day, fromTime, toTime, ...doctor });
      } else {
        updatedRoom.schedule[scheduleIndex] = { day, fromTime, toTime, ...doctor };
      }
    } else {
      // Removing a doctor
      if (scheduleIndex !== -1) {
        updatedRoom.schedule.splice(scheduleIndex, 1);
      }
    }

    await fs.writeFile(ROOMS_FILE, JSON.stringify(rooms, null, 2));
    res.status(200).json({ message: 'Room schedule updated successfully' });
  } catch (error) {
    console.error('Error updating room schedule:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});