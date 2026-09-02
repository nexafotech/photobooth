import React, { useState } from 'react';
import PhotoCapture from '../components/PhotoCapture';
import { addCheckin } from '../lib/db';

export default function CheckinForm() {
  const [studentName, setStudentName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  const createComposite = async (userPhotoFile) => {
    return new Promise((resolve, reject) => {
      const imgTemplate = new Image();
      const imgUser = new Image();
      
      let loaded = 0;
      const onLoad = () => {
        loaded++;
        if (loaded === 2) {
          const canvas = document.createElement('canvas');
          canvas.width = 1600;
          canvas.height = 900;
          const ctx = canvas.getContext('2d');
          
          // Draw template
          ctx.drawImage(imgTemplate, 0, 0, 1600, 900);
          
          // Calculate object-fit: cover for user photo inside 413, 276, 765, 343
          const boxW = 765;
          const boxH = 343;
          const boxX = 413;
          const boxY = 276;
          
          const imgRatio = imgUser.width / imgUser.height;
          const boxRatio = boxW / boxH;
          
          let drawW = boxW;
          let drawH = boxH;
          let drawX = boxX;
          let drawY = boxY;
          
          if (imgRatio > boxRatio) {
            // Image is wider than box
            drawH = boxH;
            drawW = imgUser.width * (boxH / imgUser.height);
            drawX = boxX - (drawW - boxW) / 2;
          } else {
            // Image is taller than box
            drawW = boxW;
            drawH = imgUser.height * (boxW / imgUser.width);
            drawY = boxY - (drawH - boxH) / 2;
          }
          
          // Use clipping to keep photo inside box
          ctx.save();
          ctx.beginPath();
          ctx.rect(boxX, boxY, boxW, boxH);
          ctx.clip();
          ctx.drawImage(imgUser, drawX, drawY, drawW, drawH);
          ctx.restore();
          
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        }
      };

      imgTemplate.crossOrigin = 'anonymous';
      imgTemplate.onload = onLoad;
      imgTemplate.onerror = reject;
      // Note: adjust base path if deploying to gh-pages subfolder later, but for now absolute from root is fine if base=/
      imgTemplate.src = (import.meta.env.BASE_URL || '/') + 'temp2.jpeg';
      
      imgUser.onload = onLoad;
      imgUser.onerror = reject;
      imgUser.src = URL.createObjectURL(userPhotoFile);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!studentName.trim() || !mobileNumber.trim() || !photo) {
      setError('Please provide a name, mobile number, and a photo.');
      return;
    }
    
    if (mobileNumber.length !== 10) {
      setError('Mobile number must be exactly 10 digits.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Client-side composite
      const compositeDataUrl = await createComposite(photo);
      
      // 2. Save to local IndexedDB
      await addCheckin(studentName, mobileNumber, compositeDataUrl);

      setPhotoUrl(compositeDataUrl);
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
    setMobileNumber('');
    setPhoto(null);
    setPhotoUrl('');
    setSuccess(false);
    setError('');
  };

  const handleDownload = async () => {
    try {
      const a = document.createElement('a');
      a.href = photoUrl;
      const safeName = studentName.trim().replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
      a.download = `${safeName}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
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
              style={{ marginBottom: '15px' }}
            />
          </div>

          <div>
            <label htmlFor="mobileNumber" className="sr-only" style={{ display: 'none' }}>Mobile Number</label>
            <input
              id="mobileNumber"
              type="tel"
              className="checkin-input"
              placeholder="Enter Mobile Number"
              value={mobileNumber}
              onChange={(e) => {
                // Only allow numbers
                const val = e.target.value.replace(/\D/g, '');
                if (val.length <= 10) {
                  setMobileNumber(val);
                }
              }}
              pattern="[0-9]{10}"
              maxLength="10"
              title="Please enter exactly 10 digits"
              required
              disabled={loading}
            />
          </div>
          
          <PhotoCapture onChange={setPhoto} />
          
          <button type="submit" className="checkin-button" disabled={loading}>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <div className="spinner light"></div> Processing...
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
