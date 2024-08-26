import React, { useState, useEffect } from 'react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const RoomsPage = () => {
  const [roomsData, setRoomsData] = useState([]);

  useEffect(() => {
    fetchRoomsData();
  }, []);

  const fetchRoomsData = async () => {
    try {
      const response = await fetch('/api/rooms');
      const data = await response.json();
      setRoomsData(data);
    } catch (error) {
      console.error('Error fetching rooms data:', error);
    }
  };

  const formatTime = (time) => {
    if (!time) return '';
    return time.substring(0, 5); // This will return the time in HH:MM format
  };

  return (
    <div className="rooms-container">
      <h1 className="rooms-header">Clinic Rooms Information</h1>
      {roomsData.map((room) => (
        <div key={room.number} className="room-card">
          <h2 className="room-title">Room {room.number}</h2>
          <table className="room-schedule">
            <thead>
              <tr>
                <th>Day</th>
                <th>Time</th>
                <th>Doctor</th>
              </tr>
            </thead>
            <tbody>
              {DAYS.map(day => {
                const daySchedule = room.schedule.filter(s => s.day === day);
                return daySchedule.length > 0 ? (
                  daySchedule.map((slot, index) => (
                    <tr key={`${day}-${index}`}>
                      {index === 0 && <td rowSpan={daySchedule.length}>{day}</td>}
                      <td>{formatTime(slot.fromTime)} - {formatTime(slot.toTime)}</td>
                      <td>{slot.name} ({slot.specialty})</td>
                    </tr>
                  ))
                ) : (
                  <tr key={day}>
                    <td>{day}</td>
                    <td colSpan="2">No appointments</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};

export default RoomsPage;