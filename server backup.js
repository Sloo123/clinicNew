const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

const DOCTORS_FILE = path.join(__dirname, 'doctors.json');

// Ensure doctors.json file exists
async function ensureDoctorsFile() {
  try {
    await fs.access(DOCTORS_FILE);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.writeFile(DOCTORS_FILE, '[]');
      console.log('Created doctors.json file');
    } else {
      throw error;
    }
  }
}

// Endpoint to get all doctors
app.get('/api/doctors', async (req, res) => {
  try {
    await ensureDoctorsFile();
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
    await ensureDoctorsFile();
    const { name, specialty } = req.body;
    const data = await fs.readFile(DOCTORS_FILE, 'utf8');
    const doctors = JSON.parse(data);

    // Check if doctor already exists
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

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}).on('error', (error) => {
  console.error('Error starting server:', error);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});