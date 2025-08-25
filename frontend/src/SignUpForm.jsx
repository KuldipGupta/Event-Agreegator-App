import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './authForm.css';

const SignUpForm = () => {
  const [form, setForm] = useState({
    name: '',
    username: '',
    password: '',
    collegeName: '',
    dob: '',
    gender: '',
    age: '',
    department: '',
    mobile: '',
    email: '',
  });

  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Registration successful!');
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
        <h2>Sign Up</h2>
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={form.name}
          onChange={handleChange}
          required
        />
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
        <input
          type="text"
          name="collegeName"
          placeholder="College Name"
          value={form.collegeName}
          onChange={handleChange}
          required
        />
        <input
          type="date"
          name="dob"
          placeholder="Date of Birth"
          value={form.dob}
          onChange={handleChange}
          required
        />
        <select name="gender" value={form.gender} onChange={handleChange} required>
          <option value="">Select Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
        <input
          type="number"
          name="age"
          placeholder="Age"
          value={form.age}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="department"
          placeholder="Department"
          value={form.department}
          onChange={handleChange}
          required
        />
        <input
          type="tel"
          name="mobile"
          placeholder="Mobile Number"
          value={form.mobile}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
        />
        <button type="submit" className="auth-btn">Sign Up</button>
        <p className="switch-link">
          Already have an account? <Link to="/login">Login</Link>
        </p>
        {message && <div className="message">{message}</div>}
      </form>
    </div>
  );
};

export default SignUpForm;