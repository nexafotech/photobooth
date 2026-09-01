import React, { useState } from 'react';
import imageCompression from 'browser-image-compression';
import PhotoCapture from '../components/PhotoCapture';
import api from '../lib/axios';

export default function CheckinForm() {
  const [studentName, setStudentName] = useState('');
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!studentName.trim() || !photo) {
      setError('Please provide both a name and a photo.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Compress image
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1000,
        useWebWorker: true,
        fileType: 'image/jpeg',
        initialQuality: 0.75
      };
      
      const compressedFile = await imageCompression(photo, options);
      
      // 2. Prepare FormData
      const formData = new FormData();
      formData.append('studentName', studentName);
      formData.append('photo', compressedFile, compressedFile.name || 'photo.jpg');

      // 3. Upload
      const res = await api.post('/api/checkins', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setPhotoUrl(res.data.photoUrl);
      setSuccess(true);
    } catch (err) {
      setError('An error occurred during check-in. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStudentName('');
    setPhoto(null);
    setPhotoUrl('');
    setSuccess(false);
    setError('');
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(photoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Use student name as the download filename
      const safeName = studentName.trim().replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
      a.download = `${safeName}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed', err);
    }
  };

  if (success) {
    return (
      <div className="checkin-page">
        <div className="checkin-container checkin-success">
          <div className="checkmark">✓</div>
          <h2>Checked In Successfully!</h2>
          <p>Student: <strong>{studentName}</strong></p>
          <button className="checkin-button" onClick={handleDownload}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Download Photo
          </button>
          <button className="btn-ghost" onClick={handleReset} style={{ marginTop: '5px' }}>
            Check in another family
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkin-page">
      <div className="checkin-container">
        <h1>Family Check-In</h1>
        
        {error && <div className="error-message">{error}</div>}
        
        <form className="checkin-form" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="studentName" className="sr-only" style={{ display: 'none' }}>Student Name</label>
            <input
              id="studentName"
              type="text"
              className="checkin-input"
              placeholder="Enter Student Name"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          
          <PhotoCapture onChange={setPhoto} />
          
          <button type="submit" className="checkin-button" disabled={loading}>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <div className="spinner light"></div> Uploading...
              </div>
            ) : (
              'Submit Check-In'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
