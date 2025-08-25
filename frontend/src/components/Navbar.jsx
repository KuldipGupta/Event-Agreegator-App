import React, { useState, useEffect, useRef } from 'react';
import './Navbar.css';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState({ name: '', profileImage: '' });
  const [closeTimeout, setCloseTimeout] = useState(null);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const updateUserStateFromLocalStorage = () => {
    const storedUser = JSON.parse(localStorage.getItem('user')) || {};
    setUser({
      name: storedUser.name || 'Guest',
      profileImage: storedUser.profileImage || `https://ui-avatars.com/api/?name=${storedUser.name || 'Guest'}`
    });
  };

  useEffect(() => {
    updateUserStateFromLocalStorage();
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      updateUserStateFromLocalStorage();
    };
    window.addEventListener('profileUpdate', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('profileUpdate', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
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
    navigate('/');
  };

  return (
    <div className="navbar-container">
      <div className="navbar-logo" onClick={() => navigate('/dashboard')}>Event Aggregator</div>
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
            <Link to="/profile" className="navbar-dropdown-item">My Profile</Link>
            <button onClick={handleLogout} className="navbar-dropdown-button">Logout</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;