import React, { useEffect, useState } from 'react';
import './PersonalDashboard.css';

const MS_IN_DAY = 24 * 60 * 60 * 1000;

const PersonalDashboard = () => {
  const [favorites, setFavorites] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('today');
  const [currentTime, setCurrentTime] = useState(Date.now());

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
      })
      .catch(() => {
        setFavorites([]);
        setRegistrations([]);
        setLoading(false);
      });

    const intervalId = window.setInterval(() => {
      setCurrentTime(Date.now());
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, []);

  const now = currentTime;

  const formatDateTime = (date) => new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const getCountdown = (date) => {
    const diff = new Date(date).getTime() - currentTime;

    if (diff <= 0) {
      return 'Started';
    }

    const days = Math.floor(diff / MS_IN_DAY);
    const hours = Math.floor((diff % MS_IN_DAY) / (60 * 60 * 1000));
    const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));

    if (days > 0) {
      return `Starts in ${days}d ${hours}h`;
    }

    if (hours > 0) {
      return `Starts in ${hours}h ${minutes}m`;
    }

    return `Starts in ${minutes}m`;
  };

  const isToday = (date) => {
    const target = new Date(date);
    const current = new Date();

    return target.getFullYear() === current.getFullYear()
      && target.getMonth() === current.getMonth()
      && target.getDate() === current.getDate();
  };

  const isThisWeek = (date) => {
    const diff = new Date(date).getTime() - now;
    return diff > 0 && diff <= 7 * MS_IN_DAY && !isToday(date);
  };

  const isSoon = (date) => {
    const diff = new Date(date).getTime() - now;
    return diff > 7 * MS_IN_DAY;
  };

  const upcomingEntries = [
    ...registrations.map((event) => ({ ...event, entryType: 'registered' })),
    ...favorites.map((event) => ({ ...event, entryType: 'favorite' }))
  ]
    .filter((event) => event.date && new Date(event.date).getTime() >= now)
    .sort((first, second) => new Date(first.date) - new Date(second.date));

  const dashboardGroups = {
    today: upcomingEntries.filter((event) => isToday(event.date)),
    week: upcomingEntries.filter((event) => isThisWeek(event.date)),
    soon: upcomingEntries.filter((event) => isSoon(event.date))
  };

  const activeCards = dashboardGroups[activeView === 'this-week' ? 'week' : activeView] || [];

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
      {!loading && (
        <div className="pd-focus-panel">
          <div className="pd-focus-header">
            <div>
              <p className="pd-focus-kicker">Focus View</p>
              <h3>Today / This Week / Soon</h3>
              <p className="pd-focus-copy">Track what needs attention first with live countdown cards for your registered and favorite contests.</p>
            </div>
            <div className="pd-focus-stats">
              <div className="pd-focus-stat">
                <span className="pd-focus-stat-label">Today</span>
                <strong>{dashboardGroups.today.length}</strong>
              </div>
              <div className="pd-focus-stat">
                <span className="pd-focus-stat-label">This Week</span>
                <strong>{dashboardGroups.week.length}</strong>
              </div>
              <div className="pd-focus-stat">
                <span className="pd-focus-stat-label">Soon</span>
                <strong>{dashboardGroups.soon.length}</strong>
              </div>
            </div>
          </div>

          <div className="pd-view-switcher" role="tablist" aria-label="Dashboard time windows">
            <button
              type="button"
              className={`pd-view-btn ${activeView === 'today' ? 'active' : ''}`}
              onClick={() => setActiveView('today')}
            >
              Today
            </button>
            <button
              type="button"
              className={`pd-view-btn ${activeView === 'this-week' ? 'active' : ''}`}
              onClick={() => setActiveView('this-week')}
            >
              This Week
            </button>
            <button
              type="button"
              className={`pd-view-btn ${activeView === 'soon' ? 'active' : ''}`}
              onClick={() => setActiveView('soon')}
            >
              Soon
            </button>
          </div>

          <div className="pd-countdown-grid">
            {activeCards.length === 0 ? (
              <div className="pd-countdown-empty">
                <h4>No contests in this window</h4>
                <p>Try another tab or add more favorites and registrations to keep this view populated.</p>
              </div>
            ) : (
              activeCards.map((event) => (
                <div key={`${event.entryType}-${event._id}`} className="pd-countdown-card">
                  <div className="pd-countdown-top">
                    <span className={`pd-entry-badge ${event.entryType}`}>
                      {event.entryType === 'registered' ? 'Registered' : 'Favorite'}
                    </span>
                    <span className="pd-countdown-chip">{getCountdown(event.date)}</span>
                  </div>
                  <h4>{event.title}</h4>
                  <p className="pd-countdown-platform">{event.platform || 'Unknown platform'}</p>
                  <p className="pd-countdown-date">{formatDateTime(event.date)}</p>
                  {event.href && (
                    <a href={event.href} target="_blank" rel="noopener noreferrer" className="pd-countdown-link">
                      Open contest
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
      {loading ? <p className="pd-loading">Loading...</p> : (
        <div className="personal-dashboard-content">
          <div className="pd-section">
            <h3>Upcoming Registered Contests</h3>
            <ul>
              {upcomingRegistrations.length === 0 ? <li className="pd-empty">No upcoming registrations.</li> :
                upcomingRegistrations.map(event => (
                  <li key={event._id} className="pd-card">
                    <strong>{event.title}</strong> ({event.platform})<br />
                    <span className="pd-date">{event.date ? formatDateTime(event.date) : 'Date unavailable'}</span>
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
                    <span className="pd-date">{event.date ? formatDateTime(event.date) : 'Date unavailable'}</span>
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
                    <span className="pd-date">{event.date ? formatDateTime(event.date) : 'Date unavailable'}</span>
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
                    <span className="pd-date">{event.date ? formatDateTime(event.date) : 'Date unavailable'}</span>
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