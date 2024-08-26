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
  const [debounceTimer, setDebounceTimer] = useState(null);
  const [showDoctorManagement, setShowDoctorManagement] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [editingDoctorId, setEditingDoctorId] = useState(null);

  const toggleDoctorManagement = () => {
    setShowDoctorManagement(!showDoctorManagement);
  };
  
  const handleEditDoctor = (doctor) => {
    setEditingDoctorId(doctor.id);
    setNewDoctor({ name: doctor.name, specialty: doctor.specialty });
  };
  
  const handleConfirmEdit = async (doctorId) => {
    const doctorToUpdate = savedDoctors.find(d => d.id === doctorId);
    if (doctorToUpdate) {
      try {
        const response = await fetch('/api/doctors', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            oldName: doctorToUpdate.name,
            oldSpecialty: doctorToUpdate.specialty,
            newName: newDoctor.name,
            newSpecialty: newDoctor.specialty,
          }),
        });
        if (!response.ok) {
          throw new Error('Failed to update doctor');
        }
        await fetchSavedDoctors();
        setEditingDoctorId(null);
        setNewDoctor({ name: '', specialty: '', room: '', day: '', fromTime: '', toTime: '' });
      } catch (error) {
        console.error('Error updating doctor:', error);
        setAlertMessage('Error updating doctor. Please try again.');
        setShowAlert(true);
      }
    }
  };
  
  const handleCancelEdit = () => {
    setEditingDoctorId(null);
    setNewDoctor({ name: '', specialty: '', room: '', day: '', fromTime: '', toTime: '' });
  };

  const handleRemoveDoctor = async (doctorToRemove) => {
    try {
      const response = await fetch('/api/doctors', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: doctorToRemove.name, specialty: doctorToRemove.specialty }),
      });
      if (!response.ok) {
        throw new Error('Failed to remove doctor');
      }
      await fetchSavedDoctors();
      if (editingDoctor && editingDoctor.name === doctorToRemove.name) {
        setEditingDoctor(null);
        setNewDoctor({ name: '', specialty: '', room: '', day: '', fromTime: '', toTime: '' });
      }
    } catch (error) {
      console.error('Error removing doctor:', error);
      setAlertMessage('Error removing doctor. Please try again.');
      setShowAlert(true);
    }
  };
  
  const handleUpdateDoctor = async () => {
    if (!editingDoctor) return;
  
    try {
      const response = await fetch('/api/doctors', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          oldName: editingDoctor.name,
          oldSpecialty: editingDoctor.specialty,
          newName: newDoctor.name,
          newSpecialty: newDoctor.specialty,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to update doctor');
      }
      await fetchSavedDoctors();
      setEditingDoctor(null);
      setNewDoctor({ name: '', specialty: '', room: '', day: '', fromTime: '', toTime: '' });
    } catch (error) {
      console.error('Error updating doctor:', error);
      setAlertMessage('Error updating doctor. Please try again.');
      setShowAlert(true);
    }
  };

  useEffect(() => {
    fetchSavedDoctors();
    fetchAndSetAppointments();
  }, []);
  
  const fetchAndSetAppointments = async () => {
    const roomSchedules = await fetchRoomSchedules();
    const allAppointments = roomSchedules.flatMap(room => 
      room.schedule.map(appointment => ({
        ...appointment,
        room: room.number,
        id: `${room.number}-${appointment.day}-${appointment.fromTime}`
      }))
    );
    setDoctors(allAppointments);
  };

  const fetchRoomSchedules = async () => {
    try {
      const response = await fetch('/api/rooms');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Fetched room schedules:', data);
      return data;
    } catch (error) {
      console.error('Error fetching room schedules:', error);
      setAlertMessage(`Error fetching room schedules: ${error.message}. Please try again.`);
      setShowAlert(true);
      return [];
    }
  };

  const fetchSavedDoctors = async () => {
    try {
      console.log('Fetching saved doctors...');
      const response = await fetch('/api/doctors');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Fetched doctors data:', data);
      setSavedDoctors(data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setAlertMessage(`Error fetching doctors: ${error.message}. Please try again.`);
      setShowAlert(true);
    }
  };

  const addDoctor = async () => {
    console.log('Validating doctor fields:', newDoctor);
  
    if (!newDoctor.name || !newDoctor.specialty || !newDoctor.room || !newDoctor.day || !newDoctor.fromTime || !newDoctor.toTime) {
      console.log('Validation failed. Empty fields detected.');
      setAlertMessage('Please fill in all fields.');
      setShowAlert(true);
      return;
    }
  
    if (newDoctor.fromTime >= newDoctor.toTime) {
      setAlertMessage('End time must be after start time.');
      setShowAlert(true);
      return;
    }
  
    // Check for conflicts in the specific room
    const conflictingAppointment = doctors.find(d => 
      d.room === newDoctor.room && 
      d.day === newDoctor.day &&
      ((newDoctor.fromTime >= d.fromTime && newDoctor.fromTime < d.toTime) ||
       (newDoctor.toTime > d.fromTime && newDoctor.toTime <= d.toTime) ||
       (newDoctor.fromTime <= d.fromTime && newDoctor.toTime >= d.toTime))
    );
  
    if (conflictingAppointment) {
      setAlertMessage('Cannot add doctor. The selected slot overlaps with an existing appointment.');
      setShowAlert(true);
      return;
    }
  
    const doctorToAdd = { ...newDoctor, id: Date.now() };
  
    try {
      const { response, data } = await updateRoomSchedule(newDoctor.room, newDoctor.day, newDoctor.fromTime, newDoctor.toTime, {
        name: newDoctor.name,
        specialty: newDoctor.specialty
      });
  
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update room schedule');
      }
  
      setDoctors(prevDoctors => [...prevDoctors, doctorToAdd]);
  
      if (!savedDoctors.some(d => d.name === newDoctor.name && d.specialty === newDoctor.specialty)) {
        await fetch('/api/doctors', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: newDoctor.name, specialty: newDoctor.specialty }),
        });
        await fetchSavedDoctors();
      }
  
      // Refresh appointments
      await fetchAndSetAppointments();
  
      setNewDoctor({ name: '', specialty: '', room: '', day: '', fromTime: '', toTime: '' });
      setSuggestions([]);
      setIsCustomTime(false);
    } catch (error) {
      console.error('Error saving doctor:', error);
      setAlertMessage(`Error saving doctor: ${error.message}`);
      setShowAlert(true);
    }
  };

  const removeDoctor = async (id) => {
    const doctorToRemove = doctors.find(d => d.id === id);
    if (doctorToRemove) {
      try {
        const { response, data } = await updateRoomSchedule(doctorToRemove.room, doctorToRemove.day, doctorToRemove.fromTime, doctorToRemove.toTime, null);
        if (!response.ok) {
          if (response.status === 404) {
            // If the appointment was not found, we should still remove it from the local state
            setDoctors(doctors.filter(doctor => doctor.id !== id));
            setAlertMessage('Appointment not found on the server, but removed from local view.');
            setShowAlert(true);
          } else {
            throw new Error(`Server responded with ${response.status}: ${data.error || 'Unknown error'}`);
          }
        } else {
          setDoctors(doctors.filter(doctor => doctor.id !== id));
          console.log('Appointment removed successfully');
        }
        await fetchAndSetAppointments();
      } catch (error) {
        console.error('Error removing doctor:', error);
        setAlertMessage(`Error removing appointment: ${error.message}`);
        setShowAlert(true);
      }
    }
  };

  const updateRoomSchedule = async (room, day, fromTime, toTime, doctor) => {
    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ room: room.toString(), day, fromTime, toTime, doctor }),
      });
      const data = await response.json();
      if (!response.ok) {
        console.error('Error updating room schedule:', data);
        throw new Error(data.error || 'Failed to update room schedule');
      }
      console.log('Room schedule updated:', data);
      return { response, data };
    } catch (error) {
      console.error('Error in updateRoomSchedule:', error);
      throw error;
    }
  };

  const handleInputChange = (e, field) => {
    const value = e.target.value;
    setNewDoctor({ ...newDoctor, [field]: value });

    console.log(`Input changed for ${field}:`, value);

    clearTimeout(debounceTimer);
    setDebounceTimer(setTimeout(() => {
      if (value.trim() !== '') {
        let newSuggestions = [];
        if (field === 'name' || field === 'specialty') {
          console.log(`Filtering ${field}s from savedDoctors:`, savedDoctors);
          newSuggestions = savedDoctors
            .filter(d => {
              const match = d[field].toLowerCase().includes(value.toLowerCase());
              console.log(`Checking ${d[field]}: ${match ? 'Match' : 'No match'}`);
              return match;
            })
            .map(d => ({ type: field, value: d[field] }));

          if (field === 'specialty') {
            newSuggestions = [...new Set(newSuggestions.map(s => s.value))]
              .map(s => ({ type: 'specialty', value: s }));
          }

          console.log(`Matched ${field}s:`, newSuggestions);
        }
        setSuggestions(newSuggestions);
        console.log(`Updated ${field} suggestions:`, newSuggestions);
      } else {
        setSuggestions([]);
        console.log('Cleared suggestions');
      }
    }, 300));
  };

  const selectSuggestion = (suggestion) => {
    console.log('Selecting suggestion:', suggestion);
    if (suggestion.type === 'name') {
      const doctor = savedDoctors.find(d => d.name === suggestion.value);
      if (doctor) {
        console.log('Found doctor:', doctor);
        setNewDoctor(prevState => ({
          ...prevState,
          name: doctor.name,
          specialty: doctor.specialty
        }));
      } else {
        console.log('Doctor not found in savedDoctors');
      }
    } else if (suggestion.type === 'specialty') {
      setNewDoctor(prevState => ({
        ...prevState,
        specialty: suggestion.value
      }));
    }
    setSuggestions([]);
    console.log('Updating newDoctor with suggestion');
  };

  return (
    <div className="cms-container">
      <h1 className="cms-header">Clinic Management System</h1>
      
      <button className="cms-button" onClick={toggleDoctorManagement}>
        {showDoctorManagement ? 'Hide Doctor Management' : 'Manage Doctors'}
      </button>
  
      <div className="cms-layout">
        {showDoctorManagement && (
          <div className="cms-sidebar">
            <h2>Doctors List</h2>
            <ul className="cms-doctor-list">
            {savedDoctors.map((doctor) => (
              <li key={doctor.id} className="cms-doctor-item">
                <div className="cms-doctor-item-content">
                  {editingDoctorId === doctor.id ? (
                    <>
                      <div className="cms-doctor-info">
                        <input
                          className="cms-edit-input"
                          value={newDoctor.name}
                          onChange={(e) => setNewDoctor({ ...newDoctor, name: e.target.value })}
                        />
                        <input
                          className="cms-edit-input"
                          value={newDoctor.specialty}
                          onChange={(e) => setNewDoctor({ ...newDoctor, specialty: e.target.value })}
                        />
                      </div>
                      <div className="cms-doctor-actions">
                        <button onClick={() => handleConfirmEdit(doctor.id)} className="cms-icon-button">✅</button>
                        <button onClick={handleCancelEdit} className="cms-icon-button">❌</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="cms-doctor-info">
                        <span>{doctor.name} - {doctor.specialty}</span>
                      </div>
                      <div className="cms-doctor-actions">
                        <button onClick={() => handleEditDoctor(doctor)} className="cms-icon-button">✏️</button>
                        <button onClick={() => handleRemoveDoctor(doctor)} className="cms-icon-button">🗑️</button>
                      </div>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
          </div>
        )}
        
        <div className="cms-main-content">
          <div className="cms-section">
            <h2 className="cms-section-title">Add New Doctor</h2>
            <div className="cms-form">
              <div className="cms-form-row">
                <div className="cms-form-field">
                  <label htmlFor="name">Name</label>
                  <div className="cms-input-wrapper" style={{ position: 'relative' }}>
                    <input
                      id="name"
                      className="cms-input"
                      placeholder="Enter name"
                      value={newDoctor.name}
                      onChange={(e) => handleInputChange(e, 'name')}
                    />
                    {newDoctor.name && suggestions.length > 0 && suggestions[0].type === 'name' && (
                      <ul className="cms-suggestions">
                        {suggestions.map((suggestion, index) => (
                          <li
                            key={index}
                            onClick={() => selectSuggestion(suggestion)}
                          >
                            {suggestion.value}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                <div className="cms-form-field">
                  <label htmlFor="specialty">Specialty</label>
                  <div className="cms-input-wrapper" style={{ position: 'relative' }}>
                    <input
                      id="specialty"
                      className="cms-input"
                      placeholder="Enter specialty"
                      value={newDoctor.specialty}
                      onChange={(e) => handleInputChange(e, 'specialty')}
                    />
                    {newDoctor.specialty && suggestions.length > 0 && suggestions[0].type === 'specialty' && (
                      <ul className="cms-suggestions">
                        {suggestions.map((suggestion, index) => (
                          <li
                            key={index}
                            onClick={() => selectSuggestion(suggestion)}
                          >
                            {suggestion.value}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
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
  
          {editingDoctor && (
            <div className="cms-edit-form">
              <h3>Edit Doctor</h3>
              <input
                value={newDoctor.name}
                onChange={(e) => setNewDoctor({ ...newDoctor, name: e.target.value })}
                placeholder="Name"
              />
              <input
                value={newDoctor.specialty}
                onChange={(e) => setNewDoctor({ ...newDoctor, specialty: e.target.value })}
                placeholder="Specialty"
              />
              <button onClick={handleUpdateDoctor}>Update Doctor</button>
              <button onClick={() => setEditingDoctor(null)}>Cancel</button>
            </div>
          )}
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
