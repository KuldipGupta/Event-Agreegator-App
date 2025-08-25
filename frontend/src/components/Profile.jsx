import React, { useEffect, useState } from 'react';
import './Profile.css'; // Import the CSS file

const Profile = () => {
  const [profile, setProfile] = useState({
    name: '',
    username: '', // Added username
    password: '', // Added password (though not displayed/updated directly)
    collegeName: '',
    dob: '',
    gender: '',
    age: '',
    department: '',
    mobile: '',
    email: '',
    role: '',
    bio: '',
    profileImage: '', // Changed from 'photo' to 'profileImage'
  });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState('');

  // Function to fetch profile data from the backend
  const fetchProfile = async () => {
    setLoading(true);
    setMessage('');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage('Authentication token not found. Please log in.');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to fetch profile');
      }

      const data = await res.json();
      // Ensure all fields from backend match state, especially profileImage
      setProfile({
        name: data.name || '',
        username: data.username || '',
        // password is not typically fetched for security reasons, keep it empty
        password: '', 
        collegeName: data.collegeName || '',
        dob: data.dob || '',
        gender: data.gender || '',
        age: data.age || '',
        department: data.department || '',
        mobile: data.mobile || '',
        email: data.email || '',
        role: data.role || 'user',
        bio: data.bio || '',
        profileImage: data.profileImage || `https://ui-avatars.com/api/?name=${data.name || 'User'}`,
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
      setMessage(`Failed to load profile: ${err.message}`);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, []); // Fetch on component mount

  const handleChange = e => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage('');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage('Authentication token not found. Please log in.');
        setLoading(false);
        return;
      }

      // Destructure only the updatable fields from the profile state
      const { name, email, bio, collegeName, dob, gender, age, department, mobile } = profile;

      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name, email, bio, collegeName, dob, gender, age, department, mobile }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to save profile');
      }

      const updatedProfileData = await res.json();
      setEditing(false);
      setMessage('Profile updated successfully!');

      // Update localStorage for Navbar and other components
      localStorage.setItem('user', JSON.stringify({
        name: updatedProfileData.name,
        profileImage: updatedProfileData.profileImage // Ensure this is updated from backend response
      }));
      // Dispatch a custom event to notify other components (like Navbar)
      window.dispatchEvent(new Event('profileUpdate'));

    } catch (err) {
      console.error('Error saving profile:', err);
      setMessage(`Failed to save profile: ${err.message}`);
    }
    setLoading(false);
  };

  const handleFileChange = e => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage('Please select a file to upload.');
      return;
    }
    setLoading(true);
    setMessage('');
    const formData = new FormData();
    // Use 'profileImage' as the field name to match the backend Multer setup
    formData.append('profileImage', selectedFile); 

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage('Authentication token not found. Please log in.');
        setLoading(false);
        return;
      }

      // Use the correct endpoint for profile image upload
      const res = await fetch('/api/profile/profile-image', { 
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // 'Content-Type': 'multipart/form-data' is NOT needed for FormData, browser sets it
        },
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to upload photo');
      }

      const data = await res.json();
      // Update the profile state with the new profileImage URL from the backend
      setProfile(prev => ({ ...prev, profileImage: data.profileImage })); 
      setSelectedFile(null); // Clear selected file after upload
      setMessage('Profile photo uploaded successfully!');

      // Update localStorage for Navbar and other components
      localStorage.setItem('user', JSON.stringify({
        name: profile.name, // Keep current name
        profileImage: data.profileImage // Update with new image URL
      }));
      // Dispatch a custom event to notify other components (like Navbar)
      window.dispatchEvent(new Event('profileUpdate'));

    } catch (err) {
      console.error('Error uploading photo:', err);
      setMessage(`Failed to upload photo: ${err.message}`);
    }
    setLoading(false);
  };

  return (
    <div className="profile-container">
      <h2 className="profile-title">My Profile</h2>
      {message && <p className={`profile-message ${message.includes('Failed') ? 'error' : 'success'}`}>{message}</p>}
      {loading ? (
        <p className="profile-loading">Loading profile data...</p>
      ) : (
        <div className="profile-card">
          <div className="profile-photo-section">
            <img
              src={profile.profileImage || `https://ui-avatars.com/api/?name=${profile.name || 'User'}`}
              alt="Profile"
              className="profile-photo"
            />
            {editing && (
              <div className="profile-upload-controls">
                <input type="file" accept="image/*" onChange={handleFileChange} className="profile-file-input" />
                <button type="button" onClick={handleUpload} className="profile-upload-button" disabled={!selectedFile}>
                  Upload Photo
                </button>
              </div>
            )}
          </div>

          <div className="profile-details-grid">
            <label className="profile-label">Name:</label>
            <input
              type="text"
              name="name"
              value={profile.name}
              onChange={handleChange}
              disabled={!editing}
              className="profile-input"
            />

            <label className="profile-label">Email:</label>
            <input
              type="email"
              name="email"
              value={profile.email}
              onChange={handleChange}
              disabled={!editing}
              className="profile-input"
            />

            <label className="profile-label">College Name:</label>
            <input
              type="text"
              name="collegeName"
              value={profile.collegeName}
              onChange={handleChange}
              disabled={!editing}
              className="profile-input"
            />

            <label className="profile-label">Date of Birth:</label>
            <input
              type="text" // Consider using type="date" for better UX
              name="dob"
              value={profile.dob}
              onChange={handleChange}
              disabled={!editing}
              className="profile-input"
              placeholder="YYYY-MM-DD"
            />

            <label className="profile-label">Gender:</label>
            <input
              type="text"
              name="gender"
              value={profile.gender}
              onChange={handleChange}
              disabled={!editing}
              className="profile-input"
            />

            <label className="profile-label">Age:</label>
            <input
              type="number"
              name="age"
              value={profile.age}
              onChange={handleChange}
              disabled={!editing}
              className="profile-input"
            />

            <label className="profile-label">Department:</label>
            <input
              type="text"
              name="department"
              value={profile.department}
              onChange={handleChange}
              disabled={!editing}
              className="profile-input"
            />

            <label className="profile-label">Mobile:</label>
            <input
              type="text"
              name="mobile"
              value={profile.mobile}
              onChange={handleChange}
              disabled={!editing}
              className="profile-input"
            />

            <label className="profile-label">Bio:</label>
            <textarea
              name="bio"
              value={profile.bio}
              onChange={handleChange}
              disabled={!editing}
              className="profile-textarea"
            />
          </div>

          <div className="profile-actions">
            {!editing ? (
              <button type="button" onClick={() => setEditing(true)} className="profile-button primary">
                Edit Profile
              </button>
            ) : (
              <>
                <button type="button" onClick={handleSave} className="profile-button primary">
                  Save Changes
                </button>
                <button type="button" onClick={() => {
                  setEditing(false);
                  fetchProfile(); // Re-fetch to discard unsaved changes
                }} className="profile-button secondary">
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
