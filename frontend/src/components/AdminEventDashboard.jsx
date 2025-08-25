import React, { useEffect, useState } from 'react';

const AdminEventDashboard = () => {
  const [events, setEvents] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', date: '', platform: '' });
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    // Get user role
    fetch('/api/profile', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setIsAdmin(data.role === 'admin'));

    // Get events
    fetch('/api/events')
      .then(res => res.json())
      .then(setEvents);
  }, []);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAdd = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(form)
    });
    if (res.ok) {
      const newEvent = await res.json();
      setEvents([...events, newEvent]);
      setForm({ title: '', description: '', date: '', platform: '' });
    }
  };

  const handleEdit = event => {
    setEditId(event._id);
    setForm({
      title: event.title,
      description: event.description,
      date: event.date ? event.date.slice(0, 10) : '',
      platform: event.platform
    });
  };

  const handleUpdate = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/events/${editId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(form)
    });
    if (res.ok) {
      const updatedEvent = await res.json();
      setEvents(events.map(e => (e._id === editId ? updatedEvent : e)));
      setEditId(null);
      setForm({ title: '', description: '', date: '', platform: '' });
    }
  };

  const handleDelete = async id => {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/events/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      setEvents(events.filter(e => e._id !== id));
    }
  };

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">Admin Event Management</h2>
      {isAdmin && (
        <div className="admin-event-form">
          <h3>{editId ? 'Edit Event' : 'Add Event'}</h3>
          <input name="title" placeholder="Title" value={form.title} onChange={handleChange} />
          <input name="description" placeholder="Description" value={form.description} onChange={handleChange} />
          <input name="date" type="date" value={form.date} onChange={handleChange} />
          <input name="platform" placeholder="Platform" value={form.platform} onChange={handleChange} />
          {editId ? (
            <button onClick={handleUpdate}>Update</button>
          ) : (
            <button onClick={handleAdd}>Add</button>
          )}
        </div>
      )}
      <div className="event-list">
        {events.map(event => (
          <div className="event-card" key={event._id}>
            <h3 className="event-title">{event.title}</h3>
            <p>{event.description}</p>
            <p>
              <strong>Date:</strong> {event.date && event.date.slice(0, 10)}
              <br />
              <strong>Platform:</strong> {event.platform}
            </p>
            {isAdmin && (
              <div>
                <button onClick={() => handleEdit(event)}>Edit</button>
                <button onClick={() => handleDelete(event._id)}>Delete</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminEventDashboard;