import React, { useState, useEffect } from 'react';
import EditSchedulePopup from './EditSchedulePopup';
import Login from './Login';

const ROOMS = 17;
const DAYS = ['sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const ClinicManagementSystem = () => {
  const [doctors, setDoctors] = useState([]);
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [savedDoctors, setSavedDoctors] = useState([]);
  const [newDoctor, setNewDoctor] = useState({
    name: '',
    specialty: '',
    room: '',
    days: [], // Should be an empty array to start
    fromTime: '',
    toTime: ''
  });
  
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [debounceTimer, setDebounceTimer] = useState(null);
  const [showDoctorManagement, setShowDoctorManagement] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [editingDoctorId, setEditingDoctorId] = useState(null);
  const resetNewDoctor = () => {
    setNewDoctor({
      name: '',
      specialty: '',
      room: '',
      days: [],
      fromTime: '',
      toTime: ''
    });
  };
  const toggleDoctorManagement = () => {
    setShowDoctorManagement(!showDoctorManagement);
  };
const handleEditDoctor = (doctor) => {
  console.log(doctor);
    if (doctor && doctor.id) {
      setEditingDoctorId(doctor.id);
      setNewDoctor({
        id: doctor.id,
        name: doctor.name,
        specialty: doctor.specialty
      });
    } else {
      console.error('Invalid doctor object:', doctor);
    }
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
    // Check if user is logged in (e.g., by checking for a token in localStorage)
    const token = localStorage.getItem('authToken');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchSavedDoctors();
      fetchAndSetAppointments();
    }
  }, [isLoggedIn]);
  
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
    console.log('Attempting to add doctor with data:', newDoctor);
  
    // Detailed validation checks with logging
    const validationChecks = [
      { field: 'name', valid: newDoctor.name && newDoctor.name.trim() !== '' },
      { field: 'specialty', valid: newDoctor.specialty && newDoctor.specialty.trim() !== '' },
      { field: 'room', valid: newDoctor.room !== '' },
      { field: 'days', valid: Array.isArray(newDoctor.days) && newDoctor.days.length > 0 },
      { field: 'fromTime', valid: newDoctor.fromTime !== '' },
      { field: 'toTime', valid: newDoctor.toTime !== '' }
    ];

    const failedChecks = validationChecks.filter(check => !check.valid);
    
    if (failedChecks.length > 0) {
      console.log('Validation failed. Failed checks:', failedChecks);
      const missingFields = failedChecks.map(check => check.field).join(', ');
      setAlertMessage(`Please fill in all required fields: ${missingFields}`);
      setShowAlert(true);
      return;
    }
  
    if (newDoctor.fromTime >= newDoctor.toTime) {
      console.log('Time validation failed:', newDoctor.fromTime, newDoctor.toTime);
      setAlertMessage('End time must be after start time.');
      setShowAlert(true);
      return;
    }
  
    try {
      // Check for conflicts
      for (const day of newDoctor.days) {
        const conflictingAppointment = doctors.find(d => 
          d.room === newDoctor.room && 
          d.day === day &&
          ((newDoctor.fromTime >= d.fromTime && newDoctor.fromTime < d.toTime) ||
           (newDoctor.toTime > d.fromTime && newDoctor.toTime <= d.toTime) ||
           (newDoctor.fromTime <= d.fromTime && newDoctor.toTime >= d.toTime))
        );
  
        if (conflictingAppointment) {
          console.log('Conflict detected:', conflictingAppointment);
          setAlertMessage(`Cannot add doctor. The selected slot overlaps with an existing appointment on ${day}.`);
          setShowAlert(true);
          return;
        }
      }
  
      // Proceed with adding the doctor
      for (const day of newDoctor.days) {
        console.log(`Processing day: ${day}`);
        const doctorEntry = {
          ...newDoctor,
          id: `${Date.now()}-${day}`,
          day
        };
        console.log('Sending to server:', doctorEntry);
  
        const payload = {
          room: doctorEntry.room,
          day: doctorEntry.day,
          fromTime: doctorEntry.fromTime,
          toTime: doctorEntry.toTime,
          doctor: {
            name: doctorEntry.name,
            specialty: doctorEntry.specialty
          }
        };
        console.log('Payload for updateRoomSchedule:', payload);
  
        const { response, data } = await updateRoomSchedule(payload);
  
        if (!response.ok) {
          throw new Error(data.error || `Failed to update room schedule: ${response.statusText}`);
        }
  
        console.log(`Successfully updated schedule for ${day}:`, data);
        setDoctors(prevDoctors => [...prevDoctors, doctorEntry]);
      }
  
      if (!savedDoctors.some(d => d.name === newDoctor.name && d.specialty === newDoctor.specialty)) {
        console.log('Saving new doctor to /api/doctors');
        const saveResponse = await fetch('/api/doctors', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: newDoctor.name, specialty: newDoctor.specialty }),
        });
        
        if (!saveResponse.ok) {
          throw new Error(`Failed to save doctor: ${saveResponse.statusText}`);
        }
        
        console.log('New doctor saved successfully');
        await fetchSavedDoctors();
      }
  
      await fetchAndSetAppointments();
  
      // Reset the form
      resetNewDoctor();
      setSuggestions([]);
      
      setAlertMessage('Doctor added successfully!');
      setShowAlert(true);
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
        console.log('Removing doctor:', doctorToRemove);
        const payload = {
          room: doctorToRemove.room,
          day: doctorToRemove.day,
          fromTime: doctorToRemove.fromTime,
          toTime: doctorToRemove.toTime,
          doctor: null // Indicate that we're removing the doctor
        };
        const { response, data } = await updateRoomSchedule(payload);

        if (!response.ok) {
          throw new Error(data.error || `Failed to remove doctor: ${response.statusText}`);
        }

        setDoctors(doctors.filter(doctor => doctor.id !== id));
        console.log('Doctor removed successfully');
        setAlertMessage('Doctor removed successfully!');
        setShowAlert(true);
        await fetchAndSetAppointments();
      } catch (error) {
        console.error('Error removing doctor:', error);
        setAlertMessage(`Error removing doctor: ${error.message}`);
        setShowAlert(true);
      }
    }
  };

  const updateRoomSchedule = async (payload) => {
    try {
      console.log('Sending payload to /api/rooms:', payload);
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Server responded with an error:', data);
        throw new Error(data.error || `Failed to update room schedule: ${response.statusText}`);
      }

      console.log('Room schedule updated successfully:', data);
      return { response, data };
    } catch (error) {
      console.error('Error in updateRoomSchedule:', error);
      throw error;
    }
  };
  const handleDayChange = (e, day) => {
    const { checked } = e.target;
    setNewDoctor(prevDoctor => {
      const updatedDays = checked
        ? [...(prevDoctor.days || []), day]
        : (prevDoctor.days || []).filter(d => d !== day);
      return { ...prevDoctor, days: updatedDays };
    });
  };
  const handleInputChange = (e, field) => {
    const value = e.target.value;
    setNewDoctor(prevDoctor => ({ ...prevDoctor, [field]: value }));

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

  const handleLogin = (token) => {
    localStorage.setItem('authToken', token);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setIsLoggedIn(false);
  };

  const handleEditSchedule = (schedule) => {
    setEditingSchedule(schedule);
  };

  const handleSaveSchedule = async (editedSchedule) => {
    try {
      console.log('Saving edited schedule:', editedSchedule);
      
      const existingAppointment = doctors.find(doc => doc.id === editedSchedule.id);

      const payload = {
        room: editedSchedule.room,
        day: editedSchedule.day,
        fromTime: editedSchedule.fromTime,
        toTime: editedSchedule.toTime,
        doctor: {
          name: editedSchedule.name,
          specialty: editedSchedule.specialty
        }
      };

      if (existingAppointment) {
        // If it's an existing appointment, include the original times
        payload.originalFromTime = existingAppointment.fromTime;
        payload.originalToTime = existingAppointment.toTime;
      }

      const { response, data } = await updateRoomSchedule(payload);

      if (response.ok) {
        setDoctors(prevDoctors => 
          prevDoctors.map(doctor => 
            doctor.id === editedSchedule.id ? editedSchedule : doctor
          )
        );
        setEditingSchedule(null);
        setAlertMessage('Schedule updated successfully!');
        setShowAlert(true);
      } else {
        throw new Error(data.error || 'Failed to update schedule');
      }
    } catch (error) {
      console.error('Error updating schedule:', error);
      setAlertMessage(`Error updating schedule: ${error.message}`);
      setShowAlert(true);
    }
  };
  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="cms-container">
      <h1 className="cms-header">Clinic Management System</h1>
      <button className="cms-button" onClick={handleLogout}>Logout</button>
      
      <button className="cms-button" onClick={toggleDoctorManagement}>
        {showDoctorManagement ? 'Hide Doctor Management' : 'Manage Doctors'}
      </button>
  
      <div className="cms-layout">
      {showDoctorManagement && (
        <div className="cms-sidebar">
          <h2>Doctors List</h2>
          <ul className="cms-doctor-list">
            {savedDoctors.map((doctor) => (
              <li key={doctor.id || doctor.name} className="cms-doctor-item">
                <div className="cms-doctor-item-content">
                  {editingDoctorId === (doctor.id || doctor.name) ? (
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
                        <button onClick={() => handleConfirmEdit(doctor.id || doctor.name)} className="cms-icon-button">✅</button>
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
                <label htmlFor="day">Days</label>
                <div className="cms-checkbox-group">
                  {DAYS.map((day) => (
                    <label key={day} style={{ marginRight: '10px' }}>
                      <input
                        type="checkbox"
                        value={day}
                        checked={newDoctor.days && newDoctor.days.includes(day)}
                        onChange={(e) => handleDayChange(e, day)}
                      />
                      {day}
                    </label>
                  ))}
                </div>
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
                            <button onClick={() => handleEditSchedule(doctor)} className="cms-icon-button">✏️</button>
                            <button onClick={() => removeDoctor(doctor.id)} className="cms-icon-button">🗑️</button>
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
          {editingSchedule && (
        <EditSchedulePopup
          schedule={editingSchedule}
          onSave={handleSaveSchedule}
          onCancel={() => setEditingSchedule(null)}
        />
        )}
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
