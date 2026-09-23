import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ReminderSettings.css';

const ReminderSettings = () => {
  const [preferences, setPreferences] = useState({
    enabled: true,
    timings: [24, 1]
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [customHours, setCustomHours] = useState('');

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/tracking/reminders/preferences', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPreferences(response.data.reminderPreferences);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching preferences:', error);
      setMessage({ type: 'error', text: 'Failed to load reminder preferences' });
      setLoading(false);
    }
  };

  const handleToggle = () => {
    setPreferences(prev => ({ ...prev, enabled: !prev.enabled }));
  };

  const handleTimingToggle = (hours) => {
    setPreferences(prev => {
      const timings = prev.timings.includes(hours)
        ? prev.timings.filter(h => h !== hours)
        : [...prev.timings, hours];
      return { ...prev, timings };
    });
  };

  const handleAddCustom = () => {
    const hours = parseFloat(customHours);
    if (hours > 0 && !preferences.timings.includes(hours)) {
      setPreferences(prev => ({
        ...prev,
        timings: [...prev.timings, hours].sort((a, b) => b - a)
      }));
      setCustomHours('');
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        '/api/tracking/reminders/preferences',
        preferences,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage({ type: 'success', text: 'Reminder preferences saved successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error saving preferences:', error);
      setMessage({ type: 'error', text: 'Failed to save preferences' });
    }
  };

  if (loading) {
    return <div className="reminder-settings-loading">Loading...</div>;
  }

  return (
    <div className="reminder-settings">
      <h2>Reminder Settings</h2>
      
      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="setting-group">
        <div className="toggle-setting">
          <label>
            <input
              type="checkbox"
              checked={preferences.enabled}
              onChange={handleToggle}
            />
            <span>Enable event reminders</span>
          </label>
        </div>
      </div>

      {preferences.enabled && (
        <>
          <div className="setting-group">
            <h3>Reminder Timings</h3>
            <p className="setting-description">
              Choose when you want to be reminded before an event starts
            </p>

            <div className="timing-options">
              <label className="timing-option">
                <input
                  type="checkbox"
                  checked={preferences.timings.includes(168)}
                  onChange={() => handleTimingToggle(168)}
                />
                <span>1 week before</span>
              </label>

              <label className="timing-option">
                <input
                  type="checkbox"
                  checked={preferences.timings.includes(72)}
                  onChange={() => handleTimingToggle(72)}
                />
                <span>3 days before</span>
              </label>

              <label className="timing-option">
                <input
                  type="checkbox"
                  checked={preferences.timings.includes(24)}
                  onChange={() => handleTimingToggle(24)}
                />
                <span>1 day before</span>
              </label>

              <label className="timing-option">
                <input
                  type="checkbox"
                  checked={preferences.timings.includes(12)}
                  onChange={() => handleTimingToggle(12)}
                />
                <span>12 hours before</span>
              </label>

              <label className="timing-option">
                <input
                  type="checkbox"
                  checked={preferences.timings.includes(1)}
                  onChange={() => handleTimingToggle(1)}
                />
                <span>1 hour before</span>
              </label>

              <label className="timing-option">
                <input
                  type="checkbox"
                  checked={preferences.timings.includes(0.5)}
                  onChange={() => handleTimingToggle(0.5)}
                />
                <span>30 minutes before</span>
              </label>
            </div>

            <div className="custom-timing">
              <h4>Add Custom Reminder</h4>
              <div className="custom-timing-input">
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={customHours}
                  onChange={(e) => setCustomHours(e.target.value)}
                  placeholder="Hours before event"
                />
                <button onClick={handleAddCustom} className="btn-add">Add</button>
              </div>
            </div>

            {preferences.timings.length > 0 && (
              <div className="selected-timings">
                <h4>Your Reminder Schedule:</h4>
                <div className="timing-chips">
                  {preferences.timings.sort((a, b) => b - a).map((hours) => (
                    <span key={hours} className="timing-chip">
                      {hours >= 24 ? `${hours / 24} day${hours / 24 > 1 ? 's' : ''}` : 
                       hours >= 1 ? `${hours} hour${hours > 1 ? 's' : ''}` :
                       `${hours * 60} minutes`}
                      <button
                        onClick={() => handleTimingToggle(hours)}
                        className="chip-remove"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <button onClick={handleSave} className="btn-save">
        Save Preferences
      </button>
    </div>
  );
};

export default ReminderSettings;
