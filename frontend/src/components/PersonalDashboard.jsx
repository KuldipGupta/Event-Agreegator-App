import React, { useEffect, useState } from 'react';
import './PersonalDashboard.css';

const PersonalDashboard = () => {
  const [favorites, setFavorites] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/user/dashboard', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setFavorites(data.favorites || []);
        setRegistrations(data.registrations || []);
        setLoading(false);
      });
  }, []);

  const now = new Date().getTime();

  const upcomingRegistrations = registrations.filter(event =>
    event.date && new Date(event.date).getTime() >= now
  );
  const pastRegistrations = registrations.filter(event =>
    event.date && new Date(event.date).getTime() < now
  );

  const upcomingFavorites = favorites.filter(event =>
    event.date && new Date(event.date).getTime() >= now
  );
  const pastFavorites = favorites.filter(event =>
    event.date && new Date(event.date).getTime() < now
  );

  return (
    <div className="personal-dashboard-bg">
      <h2 className="personal-dashboard-title">My Personal Dashboard</h2>
      {loading ? <p className="pd-loading">Loading...</p> : (
        <div className="personal-dashboard-content">
          <div className="pd-section">
            <h3>Upcoming Registered Contests</h3>
            <ul>
              {upcomingRegistrations.length === 0 ? <li className="pd-empty">No upcoming registrations.</li> :
                upcomingRegistrations.map(event => (
                  <li key={event._id} className="pd-card">
                    <strong>{event.title}</strong> ({event.platform})<br />
                    <span className="pd-date">{event.date && event.date.slice(0, 10)}</span>
                  </li>
                ))
              }
            </ul>
            <h3 style={{marginTop: '2rem'}}>Past Registered Contests</h3>
            <ul>
              {pastRegistrations.length === 0 ? <li className="pd-empty">No past registrations.</li> :
                pastRegistrations.map(event => (
                  <li key={event._id} className="pd-card">
                    <strong>{event.title}</strong> ({event.platform})<br />
                    <span className="pd-date">{event.date && event.date.slice(0, 10)}</span>
                  </li>
                ))
              }
            </ul>
          </div>
          <div className="pd-section">
            <h3>Upcoming Favorite Contests</h3>
            <ul>
              {upcomingFavorites.length === 0 ? <li className="pd-empty">No upcoming favorites.</li> :
                upcomingFavorites.map(event => (
                  <li key={event._id} className="pd-card">
                    <strong>{event.title}</strong> ({event.platform})<br />
                    <span className="pd-date">{event.date && event.date.slice(0, 10)}</span>
                  </li>
                ))
              }
            </ul>
            <h3 style={{marginTop: '2rem'}}>Past Favorite Contests</h3>
            <ul>
              {pastFavorites.length === 0 ? <li className="pd-empty">No past favorites.</li> :
                pastFavorites.map(event => (
                  <li key={event._id} className="pd-card">
                    <strong>{event.title}</strong> ({event.platform})<br />
                    <span className="pd-date">{event.date && event.date.slice(0, 10)}</span>
                  </li>
                ))
              }
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalDashboard;