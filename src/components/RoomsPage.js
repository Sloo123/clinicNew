import React, { useState, useEffect } from 'react';

const ROOMS = 10; // Assuming 10 rooms as in the management system
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

  return (
    <div className="rooms-container">
      <h1 className="rooms-header">Clinic Rooms Information</h1>
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
            {[...Array(ROOMS)].map((_, roomIndex) => {
              const roomNumber = (roomIndex + 1).toString();
              const roomData = roomsData.find(r => r.number === roomNumber) || { schedule: [] };
              
              return (
                <tr key={roomIndex}>
                  <td className="cms-schedule-cell">Room {roomNumber}</td>
                  {DAYS.map(day => (
                    <td key={day} className="cms-schedule-cell">
                      {roomData.schedule
                        .filter(appointment => appointment.day === day)
                        .sort((a, b) => a.fromTime.localeCompare(b.fromTime))
                        .map(appointment => (
                          <div key={`${appointment.fromTime}-${appointment.toTime}`} className="cms-time-slot cms-occupied-slot">
                            <span>
                              {appointment.fromTime} - {appointment.toTime}: {appointment.name} ({appointment.specialty})
                            </span>
                          </div>
                        ))
                      }
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RoomsPage;