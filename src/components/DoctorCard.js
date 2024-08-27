import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import DoctorAvatarSVG from '../doctor-svgrepo-com.svg';
import logo from '../LOGO.png';

const DoctorCard = () => {
    const { roomNumber } = useParams();
    const [doctor, setDoctor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const cardRef = useRef(null);

    useEffect(() => {
        fetchRoomsData();
    }, [roomNumber]);

    const fetchRoomsData = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(`/api/room/${roomNumber}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setDoctor(data);
        } catch (error) {
            console.error('Failed to fetch doctor data:', error);
            setError('Failed to fetch doctor data. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            cardRef.current.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    useEffect(() => {
        const handleFullScreenChange = () => {
            setIsFullScreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullScreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
    }, []);

    if (loading) {
        return <div className="doctor-card loading">Loading...</div>;
    }

    if (error) {
        return <div className="doctor-card error">Error: {error}</div>;
    }

    if (!doctor) {
        return <div className="doctor-card not-found">No doctor found for room number {roomNumber}.</div>;
    }

    return (
        <div className={`doctor-card landscape ${isFullScreen ? 'fullscreen' : ''}`} ref={cardRef}>
            <div className="card-header">
                <h2>חדר {roomNumber}</h2>
                <button className="fullscreen-toggle" onClick={toggleFullScreen}>
                    {isFullScreen ? 'Exit Fullscreen' : 'Fullscreen'}
                </button>
            </div>
            <div className="card-content">
                <div className="photo-section">
                    <div className="photo">
                        <img src={DoctorAvatarSVG} alt="Doctor Avatar" />
                    </div>
                </div>
                <div className="info-section">
                    <div className="doctor-details">
                        <h3 className="doctor-name">{doctor.name}</h3>
                        <p className="doctor-specialty">{doctor.specialty}</p>
                        <p className="doctor-schedule">
                            שעות קבלה: {doctor.fromTime} - {doctor.toTime}
                        </p>
                    </div>
                </div>
            </div>
            <div className="card-footer">
                <img src={logo} alt="Hospital Logo" className="hospital-logo" />
            </div>
        </div>
    );
};

export default DoctorCard;