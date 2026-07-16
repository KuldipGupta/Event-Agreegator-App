import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ActivityTracker.css';

const ActivityTracker = () => {
  const [activityHistory, setActivityHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [upcomingReminders, setUpcomingReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('history');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [historyRes, statsRes, remindersRes] = await Promise.all([
        axios.get('/api/tracking/activity/history', { headers }),
        axios.get('/api/tracking/activity/stats', { headers }),
        axios.get('/api/tracking/reminders/upcoming', { headers })
      ]);

      setActivityHistory(historyRes.data.activityHistory);
      setStats(statsRes.data.stats);
      setUpcomingReminders(remindersRes.data.reminders);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching activity data:', error);
      setLoading(false);
    }
  };

  const getActionColor = (action) => {
    const colors = {
      registered: '#2196F3',
      attended: '#4CAF50',
      completed: '#9C27B0',
      cancelled: '#F44336'
    };
    return colors[action] || '#757575';
  };

  const getActionIcon = (action) => {
    const icons = {
      registered: '📝',
      attended: '✓',
      completed: '🎉',
      cancelled: '✕'
    };
    return icons[action] || '•';
  };

  const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatReminderTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = d - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      return `in ${Math.floor(hours / 24)} days`;
    } else if (hours > 0) {
      return `in ${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `in ${minutes} minutes`;
    } else {
      return 'now';
    }
  };

  const filteredHistory = filter === 'all' 
    ? activityHistory 
    : activityHistory.filter(item => item.action === filter);

  if (loading) {
    return <div className="activity-tracker-loading">Loading activity data...</div>;
  }

  return (
    <div className="activity-tracker">
      <h2>Activity Tracker</h2>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
        <button 
          className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          Statistics
        </button>
        <button 
          className={`tab ${activeTab === 'reminders' ? 'active' : ''}`}
          onClick={() => setActiveTab('reminders')}
        >
          Upcoming Reminders
        </button>
      </div>

      {activeTab === 'history' && (
        <div className="history-section">
          <div className="filter-bar">
            <label>Filter by action:</label>
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All Actions</option>
              <option value="registered">Registered</option>
              <option value="attended">Attended</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="empty-state">
              <p>No activity history found</p>
            </div>
          ) : (
            <div className="timeline">
              {filteredHistory.map((item, index) => (
                <div key={index} className="timeline-item">
                  <div 
                    className="timeline-marker" 
                    style={{ backgroundColor: getActionColor(item.action) }}
                  >
                    {getActionIcon(item.action)}
                  </div>
                  <div className="timeline-content">
                    <div className="activity-header">
                      <span 
                        className="activity-action"
                        style={{ color: getActionColor(item.action) }}
                      >
                        {item.action.toUpperCase()}
                      </span>
                      <span className="activity-time">{formatDate(item.timestamp)}</span>
                    </div>
                    <div className="activity-event">
                      {item.eventId ? (
                        <>
                          <h4>{item.eventId.title}</h4>
                          <p>{item.eventId.description}</p>
                          <span className="event-date">
                            Event Date: {formatDate(item.eventId.date)}
                          </span>
                        </>
                      ) : (
                        <p className="deleted-event">Event details not available</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'stats' && stats && (
        <div className="stats-section">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📚</div>
              <div className="stat-number">{stats.totalRegistrations}</div>
              <div className="stat-label">Total Registrations</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">✓</div>
              <div className="stat-number">{stats.totalAttended}</div>
              <div className="stat-label">Events Attended</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🎉</div>
              <div className="stat-number">{stats.totalCompleted}</div>
              <div className="stat-label">Events Completed</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">⭐</div>
              <div className="stat-number">{stats.totalFavorites}</div>
              <div className="stat-label">Favorites</div>
            </div>
          </div>

          <div className="progress-section">
            <div className="progress-card">
              <h3>Attendance Rate</h3>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${stats.attendanceRate}%`, backgroundColor: '#4CAF50' }}
                ></div>
              </div>
              <p className="progress-text">{stats.attendanceRate}%</p>
            </div>

            <div className="progress-card">
              <h3>Completion Rate</h3>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${stats.completionRate}%`, backgroundColor: '#9C27B0' }}
                ></div>
              </div>
              <p className="progress-text">{stats.completionRate}%</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'reminders' && (
        <div className="reminders-section">
          {upcomingReminders.length === 0 ? (
            <div className="empty-state">
              <p>No upcoming reminders</p>
            </div>
          ) : (
            <div className="reminders-list">
              {upcomingReminders.map((reminder, index) => (
                <div key={index} className="reminder-card">
                  <div className="reminder-header">
                    <span className="reminder-icon">🔔</span>
                    <div className="reminder-timing">
                      <span className="reminder-time">{formatReminderTime(reminder.reminderTime)}</span>
                      <span className="reminder-type">{reminder.type}</span>
                    </div>
                  </div>
                  <div className="reminder-event">
                    {reminder.eventId ? (
                      <>
                        <h4>{reminder.eventId.title}</h4>
                        <p>{reminder.eventId.description}</p>
                        <div className="reminder-meta">
                          <span>Event: {formatDate(reminder.eventId.date)}</span>
                          <span>Reminder: {formatDate(reminder.reminderTime)}</span>
                        </div>
                      </>
                    ) : (
                      <p className="deleted-event">Event details not available</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ActivityTracker;
