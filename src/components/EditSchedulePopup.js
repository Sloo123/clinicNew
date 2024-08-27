import React, { useState } from 'react';
 // Make sure to create this CSS file

const EditSchedulePopup = ({ schedule, onSave, onCancel }) => {
  const [editedSchedule, setEditedSchedule] = useState(schedule);
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedSchedule({ ...editedSchedule, [name]: value });
  };
  const handleSave = () => {
    onSave(editedSchedule);
  };

  return (
    <div className="popup-backdrop">
      <div className="edit-schedule-popup">
        <div className="popup-header">
          <h2>Edit Schedule</h2>
        </div>
        <div className="popup-body">
          <div className="form-group">
            <label htmlFor="name">Name:</label>
            <input
              type="text"
              id="name"
              name="name"
              value={editedSchedule.name}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="specialty">Specialty:</label>
            <input
              type="text"
              id="specialty"
              name="specialty"
              value={editedSchedule.specialty}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="fromTime">From Time:</label>
            <input
              type="time"
              id="fromTime"
              name="fromTime"
              value={editedSchedule.fromTime}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="toTime">To Time:</label>
            <input
              type="time"
              id="toTime"
              name="toTime"
              value={editedSchedule.toTime}
              onChange={handleInputChange}
            />
          </div>
        </div>
        <div className="popup-footer">
          <button className="save-button" onClick={handleSave}>Save</button>
          <button className="cancel-button" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default EditSchedulePopup;