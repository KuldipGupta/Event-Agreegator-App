import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './LandingPage.css';

const features = [
  {
    title: "Discover Events",
    desc: "Find coding contests, workshops, seminars, and more from multiple platforms in one place.",
    icon: "🎉"
  },
  {
    title: "Personal Dashboard",
    desc: "Track upcoming and past events, save favorites, and get personalized recommendations.",
    icon: "📊"
  },
  {
    title: "Profile & Networking",
    desc: "Build your profile, connect with peers, and expand your professional network.",
    icon: "👥"
  },
  {
    title: "Easy Registration",
    desc: "Register for events with a single click and get reminders so you never miss out.",
    icon: "📝"
  },
  {
    title: "Contest Aggregation",
    desc: "See all major coding contests from Codeforces, AtCoder, LeetCode, and more.",
    icon: "💻"
  }
];

const LandingPage = () => {
  const navigate = useNavigate();
  const [showContact, setShowContact] = useState(false);
  const [contact, setContact] = useState({ name: '', email: '', message: '' });
  const [contactMsg, setContactMsg] = useState('');

  const handleContactChange = e => {
    setContact({ ...contact, [e.target.name]: e.target.value });
  };

  const handleContactSubmit = async e => {
    e.preventDefault();
    setContactMsg('Sending...');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contact)
      });
      if (res.ok) {
        setContactMsg('Message sent! We will get back to you soon.');
        setContact({ name: '', email: '', message: '' });
      } else {
        setContactMsg('Failed to send message. Please try again later.');
      }
    } catch {
      setContactMsg('Failed to send message. Please try again later.');
    }
  };

  return (
    <div className="landing-bg">
      <header className="landing-header">
        <div className="landing-logo" onClick={() => navigate('/')}>
          <span className="logo-icon">🌐</span> Event Aggregator
        </div>
        <div className="landing-header-actions">
          <Link to="/login" className="landing-btn">Login</Link>
          <button className="joinnow-btn" onClick={() => navigate('/signup')}>
            Join Now
          </button>
        </div>
      </header>
      <div className="landing-main">
        <div className="landing-content">
          <h1>Welcome to <span className="highlight">Event Aggregator</span></h1>
          <h2>Empowering Students & Professionals</h2>
          <p>
            Discover, join, and create amazing events.<br />
            Connect with people, grow your network, and never miss out!
          </p>
          <div className="landing-actions">
            <Link to="/login" className="landing-btn primary">Login</Link>
            <Link to="/signup" className="landing-btn secondary">Sign Up</Link>
          </div>
        </div>
        <div className="landing-features">
          <h3 className="features-title">Why Event Aggregator?</h3>
          <div className="features-list">
            {features.map((f, idx) => (
              <div className="feature-card" key={idx}>
                <div className="feature-icon">{f.icon}</div>
                <div>
                  <h4>{f.title}</h4>
                  <p>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="landing-help">
          <h3>How does this help students?</h3>
          <ul>
            <li><strong>Centralized Information:</strong> No more searching multiple sites for contests and events.</li>
            <li><strong>Reminders & Tracking:</strong> Never miss deadlines or opportunities.</li>
            <li><strong>Networking:</strong> Connect with like-minded peers and mentors.</li>
            <li><strong>Skill Growth:</strong> Participate in coding contests and workshops to boost your resume.</li>
            <li><strong>Personalized Experience:</strong> Get event suggestions tailored to your interests.</li>
          </ul>
        </div>
      </div>
      <footer className="landing-footer">
        <span>© {new Date().getFullYear()} Event Aggregator. All rights reserved.</span>
        <span>
          <button
            className="footer-link"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            onClick={() => setShowContact(true)}
          >
            Contact Us
          </button>
        </span>
      </footer>

      {/* Contact Us Modal */}
      {showContact && (
        <div className="contact-modal-bg" onClick={() => setShowContact(false)}>
          <div className="contact-modal" onClick={e => e.stopPropagation()}>
            <h3>Contact Us</h3>
            <form onSubmit={handleContactSubmit} className="contact-form">
              <input
                type="text"
                name="name"
                placeholder="Your Name"
                value={contact.name}
                onChange={handleContactChange}
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Your Email"
                value={contact.email}
                onChange={handleContactChange}
                required
              />
              <textarea
                name="message"
                placeholder="Your Message"
                value={contact.message}
                onChange={handleContactChange}
                required
              />
              <button type="submit">Send</button>
              <button type="button" onClick={() => setShowContact(false)} style={{ marginLeft: '1rem' }}>
                Cancel
              </button>
            </form>
            {contactMsg && <p className="contact-msg">{contactMsg}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;