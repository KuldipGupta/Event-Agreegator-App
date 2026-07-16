import React, { useState, useEffect, useRef } from 'react';
import './Navbar.css';
import { Link, useNavigate } from 'react-router-dom';

const defaultAvatar = (name = 'Guest') => `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Guest')}`;

const formatNotificationTime = (date) => new Date(date).toLocaleString('en-US', {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
});

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [user, setUser] = useState({ name: 'Guest', profileImage: defaultAvatar('Guest') });
  const [closeTimeout, setCloseTimeout] = useState(null);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);

  const updateUserStateFromLocalStorage = () => {
    let storedUser = {};

    try {
      storedUser = JSON.parse(localStorage.getItem('user')) || {};
    } catch (error) {
      storedUser = {};
    }

    const name = storedUser.name || 'Guest';
    setUser({
      name,
      profileImage: storedUser.profileImage || defaultAvatar(name)
    });
  };

  const fetchNotifications = async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      setNotifications([]);
      return;
    }

    try {
      const response = await fetch('/api/tracking/reminders/messages', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      setNotifications(data.messages || []);
    } catch (error) {
      setNotifications([]);
    }
  };

  useEffect(() => {
    updateUserStateFromLocalStorage();
    fetchNotifications();
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      updateUserStateFromLocalStorage();
      fetchNotifications();
    };

    const handleDocumentClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }

      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };

    window.addEventListener('profileUpdate', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('mousedown', handleDocumentClick);

    const intervalId = window.setInterval(fetchNotifications, 60000);

    return () => {
      window.removeEventListener('profileUpdate', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('mousedown', handleDocumentClick);
      window.clearInterval(intervalId);
    };
  }, []);

  const handleMouseEnter = () => {
    if (closeTimeout) clearTimeout(closeTimeout);
    setOpen(true);
  };

  const handleMouseLeave = () => {
    const timeout = setTimeout(() => setOpen(false), 200);
    setCloseTimeout(timeout);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setNotifications([]);
    navigate('/');
  };

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  const handleNotificationToggle = async () => {
    const nextOpenState = !notificationsOpen;
    setNotificationsOpen(nextOpenState);

    if (nextOpenState) {
      await fetchNotifications();
    }
  };

  const handleNotificationClick = async (notificationId, isRead) => {
    if (isRead) {
      return;
    }

    const token = localStorage.getItem('token');

    if (!token) {
      return;
    }

    try {
      const response = await fetch(`/api/tracking/reminders/messages/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }

      setNotifications((current) => current.map((notification) => (
        notification._id === notificationId
          ? { ...notification, read: true }
          : notification
      )));
    } catch (error) {
      // Ignore badge update failures and keep the latest fetched state.
    }
  };

  return (
    <div className="navbar-container">
      <div className="navbar-logo" onClick={() => navigate('/dashboard')}>Event Aggregator</div>
      <div className="navbar-actions">
        <div className="navbar-notification" ref={notificationRef}>
          <button
            type="button"
            className="navbar-notification-button"
            onClick={handleNotificationToggle}
            aria-label="Open notifications"
          >
            <span className="navbar-notification-icon">🔔</span>
            {unreadCount > 0 && <span className="navbar-notification-badge">{unreadCount}</span>}
          </button>

          {notificationsOpen && (
            <div className="navbar-notification-panel">
              <div className="navbar-notification-header">
                <h3>Notifications</h3>
                <span>{unreadCount} unread</span>
              </div>

              {notifications.length === 0 ? (
                <p className="navbar-notification-empty">No reminders yet.</p>
              ) : (
                <div className="navbar-notification-list">
                  {notifications.slice(0, 6).map((notification) => (
                    <button
                      key={notification._id}
                      type="button"
                      className={`navbar-notification-item ${notification.read ? 'read' : 'unread'}`}
                      onClick={() => handleNotificationClick(notification._id, notification.read)}
                    >
                      <div className="navbar-notification-row">
                        <strong>{notification.title}</strong>
                        {!notification.read && <span className="navbar-notification-dot" />}
                      </div>
                      <p>{notification.message}</p>
                      <span className="navbar-notification-time">{formatNotificationTime(notification.createdAt)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div
          className="navbar-user-section"
          ref={dropdownRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <img src={user.profileImage} alt="user" className="navbar-user-icon" />
          <span className="navbar-user-name">{user.name}</span>
          {open && (
            <div className="navbar-dropdown">
              <Link to="/personal-dashboard" className="navbar-dropdown-item">My Dashboard</Link>
              <Link to="/profile" className="navbar-dropdown-item">My Profile</Link>
              <button onClick={handleLogout} className="navbar-dropdown-button">Logout</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;