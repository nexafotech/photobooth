import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="checkin-page" style={{ justifyContent: 'center', textAlign: 'center' }}>
      <div className="checkin-form" style={{ maxWidth: '400px', width: '100%' }}>
        <h1 style={{ marginBottom: '2rem', color: '#333' }}>Welcome to Family Check-In</h1>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Link 
            to="/checkin" 
            className="checkin-button" 
            style={{ textDecoration: 'none', textAlign: 'center', padding: '15px' }}
          >
            Family Check-In
          </Link>
          
          <Link 
            to="/admin" 
            className="checkin-button" 
            style={{ 
              textDecoration: 'none', 
              textAlign: 'center', 
              padding: '15px',
              backgroundColor: '#4b5563' // Darker gray for staff button
            }}
          >
            Staff Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
