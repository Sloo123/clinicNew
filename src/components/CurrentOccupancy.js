import React, { useState, useEffect } from 'react';

const RoomOccupancy = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await fetch('/api/rooms');
      if (!response.ok) {
        throw new Error('Failed to fetch room data');
      }
      const data = await response.json();
      setRooms(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="room-occupancy">
      <h1>Room Occupancy</h1>
      <div className="room-grid">
        {rooms.map((room) => (
          <div key={room.number} className="room-card">
            <h2>Room {room.number}</h2>
            {room.doctor ? (
              <div className="doctor-info">
                <p>Doctor: {room.doctor.name}</p>
                <p>Specialty: {room.doctor.specialty}</p>
              </div>
            ) : (
              <p>Empty</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoomOccupancy;