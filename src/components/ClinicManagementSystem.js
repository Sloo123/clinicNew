import React, { useState, useEffect } from 'react';

const ROOMS = 10;
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const HOURS = ['9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

const ClinicManagementSystem = () => {
  const [doctors, setDoctors] = useState([]);
  const [savedDoctors, setSavedDoctors] = useState([]);
  const [newDoctor, setNewDoctor] = useState({ 
    name: '', 
    specialty: '', 
    room: '', 
    day: '', 
    fromTime: '',
    toTime: ''
  });
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isCustomTime, setIsCustomTime] = useState(false);
  

  useEffect(() => {
    fetchSavedDoctors();
  }, []);

  const fetchSavedDoctors = async () => {
    try {
      const response = await fetch('/api/doctors');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setSavedDoctors(data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setAlertMessage(`Error fetching doctors: ${error.message}. Please try again.`);
      setShowAlert(true);
    }
  };

  const addDoctor = async () => {
    if (!newDoctor.name || !newDoctor.specialty || !newDoctor.room || !newDoctor.day || !newDoctor.fromTime || !newDoctor.toTime) {
      setAlertMessage('Please fill in all fields.');
      setShowAlert(true);
      return;
    }

    if (newDoctor.fromTime >= newDoctor.toTime) {
      setAlertMessage('End time must be after start time.');
      setShowAlert(true);
      return;
    }

    if (doctors.some(d => d.room === newDoctor.room && d.day === newDoctor.day && d.time === newDoctor.time)) {
      setAlertMessage('Cannot add doctor. The selected slot is already occupied.');
      setShowAlert(true);
      return;
    }

    const newDoctorWithId = { ...newDoctor, id: Date.now() };
    setDoctors([...doctors, newDoctorWithId]);

    await updateRoomSchedule(newDoctor.room, newDoctor.day, newDoctor.time, {
      name: newDoctor.name,
      specialty: newDoctor.specialty
    });

    if (!savedDoctors.some(d => d.name === newDoctor.name && d.specialty === newDoctor.specialty)) {
      try {
        await fetch('/api/doctors', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: newDoctor.name, specialty: newDoctor.specialty }),
        });
        fetchSavedDoctors();
      } catch (error) {
        console.error('Error saving doctor:', error);
        setAlertMessage('Error saving doctor. Please try again.');
        setShowAlert(true);
      }
    }

    setNewDoctor({ name: '', specialty: '', room: '', day: '', time: '' });
    setSuggestions([]);
    setIsCustomTime(false);
  };

  const removeDoctor = async (id) => {
    const doctorToRemove = doctors.find(d => d.id === id);
    if (doctorToRemove) {
      setDoctors(doctors.filter(doctor => doctor.id !== id));
      await updateRoomSchedule(doctorToRemove.room, doctorToRemove.day, doctorToRemove.time, null);
    }
  };

  const updateRoomSchedule = async (room, day, time, doctor) => {
    try {
      await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ room, day, time, doctor }),
      });
    } catch (error) {
      console.error('Error updating room schedule:', error);
      setAlertMessage('Error updating room schedule. Please try again.');
      setShowAlert(true);
    }
  };

  const handleInputChange = (e, field) => {
    const value = e.target.value;
    setNewDoctor({ ...newDoctor, [field]: value });

    if (field === 'name' && value) {
      const matchedDoctors = savedDoctors.filter(d => 
        d.name.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(matchedDoctors);
    } else {
      setSuggestions([]);
    }
  };

  const selectDoctor = (doctor) => {
    setNewDoctor({ ...newDoctor, name: doctor.name, specialty: doctor.specialty });
    setSuggestions([]);
  };

  return (
    <div className="cms-container">
      <h1 className="cms-header">Clinic Management System</h1>
      
      <div className="cms-section">
        <h2 className="cms-section-title">Add New Doctor</h2>
        <div className="cms-form">
          <div className="cms-form-row">
            <div className="cms-form-field">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                className="cms-input"
                placeholder="Enter name"
                value={newDoctor.name}
                onChange={(e) => setNewDoctor({ ...newDoctor, name: e.target.value })}
              />
            </div>
            <div className="cms-form-field">
              <label htmlFor="specialty">Specialty</label>
              <input
                id="specialty"
                className="cms-input"
                placeholder="Enter specialty"
                value={newDoctor.specialty}
                onChange={(e) => setNewDoctor({ ...newDoctor, specialty: e.target.value })}
              />
            </div>
          </div>
          <div className="cms-form-row">
            <div className="cms-form-field">
              <label htmlFor="room">Room</label>
              <select
                id="room"
                className="cms-input"
                value={newDoctor.room}
                onChange={(e) => setNewDoctor({ ...newDoctor, room: e.target.value })}
              >
                <option value="">Select Room</option>
                {[...Array(ROOMS)].map((_, i) => (
                  <option key={i} value={String(i + 1)}>Room {i + 1}</option>
                ))}
              </select>
            </div>
            <div className="cms-form-field">
              <label htmlFor="day">Day</label>
              <select
                id="day"
                className="cms-input"
                value={newDoctor.day}
                onChange={(e) => setNewDoctor({ ...newDoctor, day: e.target.value })}
              >
                <option value="">Select Day</option>
                {DAYS.map((day) => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="cms-form-row">
            <div className="cms-form-field">
              <label htmlFor="fromTime">From Time</label>
              <input
                id="fromTime"
                type="time"
                className="cms-input"
                value={newDoctor.fromTime}
                onChange={(e) => setNewDoctor({ ...newDoctor, fromTime: e.target.value })}
              />
            </div>
            <div className="cms-form-field">
              <label htmlFor="toTime">To Time</label>
              <input
                id="toTime"
                type="time"
                className="cms-input"
                value={newDoctor.toTime}
                onChange={(e) => setNewDoctor({ ...newDoctor, toTime: e.target.value })}
              />
            </div>
          </div>
        </div>
        <button className="cms-button cms-add-doctor-button" onClick={addDoctor}>Add Doctor</button>
      </div>

      <div className="cms-section">
        <h2 className="cms-section-title">Room Schedule</h2>
        <div className="cms-schedule-container">
          <table className="cms-schedule-table">
            <thead>
              <tr>
                <th className="cms-schedule-header">Room</th>
                {DAYS.map(day => (
                  <th key={day} className="cms-schedule-header">{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...Array(ROOMS)].map((_, roomIndex) => (
                <tr key={roomIndex}>
                  <td className="cms-schedule-cell">Room {roomIndex + 1}</td>
                  {DAYS.map(day => (
                    <td key={day} className="cms-schedule-cell">
                      {doctors
                        .filter(d => d.room === String(roomIndex + 1) && d.day === day)
                        .sort((a, b) => a.fromTime.localeCompare(b.fromTime))
                        .map(doctor => (
                          <div key={doctor.id} className="cms-time-slot cms-occupied-slot">
                            <span>{doctor.fromTime} - {doctor.toTime}: {doctor.name} ({doctor.specialty})</span>
                            <button 
                              className="cms-remove-button"
                              onClick={() => removeDoctor(doctor.id)}
                            >
                              ×
                            </button>
                          </div>
                        ))
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAlert && (
        <div className="cms-alert">
          <h3>Alert</h3>
          <p>{alertMessage}</p>
          <button className="cms-button" onClick={() => setShowAlert(false)}>OK</button>
        </div>
      )}
    </div>
  );
};

export default ClinicManagementSystem;