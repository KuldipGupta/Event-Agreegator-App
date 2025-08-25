import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import LoginForm from './LoginForm';
import SignupForm from './SignUpForm';
import EventDashboard from './components/eventDashboard';
import AdminEventDashboard from './components/AdminEventDashboard'; // <-- import admin dashboard
import Profile from './components/Profile';
import Navbar from './components/Navbar';
import PersonalDashboard from './components/PersonalDashboard';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/signup" element={<SignupForm />} />
        <Route path="/dashboard" element={<><Navbar /><EventDashboard /></>} />
        <Route path="/admin-events" element={<><Navbar /><AdminEventDashboard /></>} /> {/* <-- add this */}
        <Route path="/profile" element={<><Navbar /><Profile /></>} />
          <Route path="/personal-dashboard" element={<><Navbar /><PersonalDashboard /></>} />
      </Routes>
    </Router>
  );
};

export default App;