import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../lib/axios';
import { useAuth } from '../hooks/useAuth';

export default function Admin() {
  const { logout } = useAuth();
  const [showModal, setShowModal] = useState(false);

  const handleClearAll = async () => {
    try {
      await api.delete('/api/checkins?confirm=true');
      setShowModal(false);
      alert('All records cleared successfully.');
    } catch (err) {
      console.error('Failed to clear checkins', err);
      alert('Failed to clear records.');
    }
  };

  const handleExport = () => {
    window.location.href = '/api/checkins/export';
  };

  return (
    <div className="checkin-page" style={{ flexDirection: 'column' }}>
      <div className="checkin-container" style={{ maxWidth: '500px', padding: '40px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '35px' }}>
          <h1 style={{ color: 'var(--text-main)', margin: '0 0 10px 0', fontSize: '1.8rem', fontWeight: '700' }}>
            Staff Dashboard
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.95rem' }}>
            Manage check-in records and display settings.
          </p>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Primary Action */}
          <Link 
            to="/display" 
            className="checkin-button" 
            style={{ 
              textDecoration: 'none', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '10px' 
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect>
              <polyline points="17 2 12 7 7 2"></polyline>
            </svg>
            Launch Display Screen
          </Link>

          {/* Secondary Action */}
          <button 
            className="btn-secondary" 
            onClick={handleExport}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Export to Excel
          </button>

          {/* Destructive Action */}
          <button 
            className="btn-danger-outline" 
            onClick={() => setShowModal(true)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            Clear All Records
          </button>
          
        </div>

        <div style={{ marginTop: '40px', borderTop: '1px solid #e5e7eb', paddingTop: '20px', textAlign: 'center' }}>
          <button 
            onClick={logout} 
            className="btn-ghost"
          >
            Sign out
          </button>
        </div>
      </div>

      {showModal && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal">
            <h2 style={{ color: '#ef4444' }}>Delete All Records?</h2>
            <p>This will permanently delete all check-in records and photos. This cannot be undone.</p>
            <div className="confirm-modal-actions" style={{ marginTop: '20px' }}>
              <button className="confirm-modal-btn cancel" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="confirm-modal-btn delete" onClick={handleClearAll}>
                Delete Records
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
