import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './eventDashboard.css';



const EventDashboard = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [platformInput, setPlatformInput] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError('');

      const now = new Date();
      const start = new Date(now);
      const end = new Date(now);
      start.setDate(start.getDate() - 15);
      end.setDate(end.getDate() + 15);

    const url = `/api/clist/contests?start=${start.toISOString()}&end=${end.toISOString()}`;

      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const data = await res.json();
        setEvents(data.objects || []);
      } catch (err) {
        setError('Failed to fetch contests. Please check your API key or network.');
        setEvents([]);
      }
      setLoading(false);
    };

    fetchEvents();
  }, []);

  const nowUTC = new Date().getTime();
  const fifteenDaysMs = 15 * 24 * 60 * 60 * 1000;

  const filteredEvents = platformFilter
    ? events.filter(e =>
        (e.resource || '').toLowerCase().includes(platformFilter.toLowerCase())
      )
    : events;

  const pastEvents = filteredEvents.filter(e => {
    const startTime = new Date(e.start).getTime();
    return startTime < nowUTC && startTime >= (nowUTC - fifteenDaysMs);
  });

  const upcomingEvents = filteredEvents.filter(e => {
    const startTime = new Date(e.start).getTime();
    return startTime >= nowUTC && startTime <= (nowUTC + fifteenDaysMs);
  });

  const handleSearch = () => {
    setPlatformFilter(platformInput.trim());
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleRegister = async (event) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login to register for contests.');
      return;
    }
    await fetch('/api/user/register/' + event.id, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(event)
    });
    alert('Registered for contest!');
  };

  const handleFavorite = async (event) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login to add favorites.');
      return;
    }
    await fetch('/api/user/favorite/' + event.id, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(event)
    });
    alert('Added to favorites!');
  };

  return (
    <div className="dashboard-container">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button
          className="personal-dashboard-btn"
          onClick={() => navigate('/personal-dashboard')}
        >
          My Personal Dashboard
        </button>
      </div>
      <h2 className="dashboard-title">Contests (Filter by Platform)</h2>
      <div className="search-bar">
        <input
          type="text"
          placeholder="Platform (e.g. Codeforces, AtCoder)"
          value={platformInput}
          onChange={e => setPlatformInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button onClick={handleSearch}>Search</button>
      </div>

      <h2 className="dashboard-title">Upcoming Contests (Next 15 Days)</h2>
      {loading && <p className="loading">Loading...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && upcomingEvents.length === 0 && (
        <p className="no-events">No upcoming contests found.</p>
      )}
      <div className="event-list">
        {upcomingEvents.map((e) => (
          <div className="event-card" key={e.id}>
            <h3 className="event-title">{e.event}</h3>
            <p className="event-platform">
              <strong>Platform:</strong> {e.resource || 'Unknown'}
            </p>
            <p className="event-start">
              <strong>Start:</strong> {new Date(e.start).toLocaleString()}
            </p>
            <p className="event-duration">
              <strong>Duration:</strong> {Math.floor(e.duration / 3600)}h {Math.floor((e.duration / 60) % 60)}m
            </p>
            <a className="event-link" href={e.href} target="_blank" rel="noopener noreferrer">
              Visit Event
            </a>
            <div>
              <button className="event-action-btn" onClick={() => handleRegister(e)}>Register</button>
              <button className="event-action-btn" onClick={() => handleFavorite(e)}>Favorite</button>
            </div>
          </div>
        ))}
      </div>

      <h2 className="dashboard-title" style={{marginTop: '40px'}}>Past Contests (Last 15 Days)</h2>
      {!loading && !error && pastEvents.length === 0 && (
        <p className="no-events">No past contests found.</p>
      )}
      <div className="event-list">
        {pastEvents.map((e) => (
          <div className="event-card" key={e.id}>
            <h3 className="event-title">{e.event}</h3>
            <p className="event-platform">
              <strong>Platform:</strong> {e.resource || 'Unknown'}
            </p>
            <p className="event-start">
              <strong>Start:</strong> {new Date(e.start).toLocaleString()}
            </p>
            <p className="event-duration">
              <strong>Duration:</strong> {Math.floor(e.duration / 3600)}h {Math.floor((e.duration / 60) % 60)}m
            </p>
            <a className="event-link" href={e.href} target="_blank" rel="noopener noreferrer">
              Visit Event
            </a>
            <div>
              <button className="event-action-btn" onClick={() => handleRegister(e)}>Register</button>
              <button className="event-action-btn" onClick={() => handleFavorite(e)}>Favorite</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventDashboard;