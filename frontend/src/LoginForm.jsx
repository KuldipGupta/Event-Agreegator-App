import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './authForm.css';

const LoginForm = () => {
  const [form, setForm] = useState({ username: '', password: '' });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Login successful!');
        if (data.token) {
          localStorage.setItem('token', data.token);
          navigate('/dashboard');
        }
      } else {
        setMessage(data.message || 'Something went wrong');
      }
    } catch {
      setMessage('Server error');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-appname">Event Aggregator</div>
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Login</h2>
        <input
          type="text"
          name="username"
          placeholder="Username"
          value={form.username}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
        />
        <button type="submit" className="auth-btn">Login</button>
        <p className="switch-link">
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </p>
        {message && <div className="message">{message}</div>}
      </form>
    </div>
  );
};

export default LoginForm;