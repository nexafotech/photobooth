import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ExcelJS from 'exceljs';
import { getCheckins, clearCheckins } from '../lib/db';
// We simulate auth for the completely static version
// import { useAuth } from '../hooks/useAuth';

export default function Admin() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  const handleClearAll = async () => {
    try {
      await clearCheckins();
      setShowModal(false);
      alert('All records cleared successfully.');
    } catch (err) {
      console.error('Failed to clear checkins', err);
      alert('Failed to clear records.');
    }
  };

  const handleExport = async () => {
    try {
      const records = await getCheckins();
      
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Checkins');
      
      worksheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Student Name', key: 'studentName', width: 30 },
        { header: 'Mobile Number', key: 'mobileNumber', width: 20 },
        { header: 'Date / Time', key: 'createdAt', width: 30 },
        { header: 'Edited Photo', key: 'photo', width: 45 },
      ];
      
      for (const record of records) {
        const row = worksheet.addRow({
          id: record.id,
          studentName: record.studentName,
          mobileNumber: record.mobileNumber || '',
          createdAt: new Date(record.createdAt).toLocaleString(),
        });
        
        row.height = 100;
        
        if (record.photoDataUrl) {
          try {
            // Extract base64
            const base64Data = record.photoDataUrl.split(',')[1];
            
            const imageId = workbook.addImage({
              base64: base64Data,
              extension: 'jpeg',
            });
            
            // Add image to column E (index 4) for this row
            worksheet.addImage(imageId, {
              tl: { col: 4, row: row.number - 1 },
              ext: { width: 160, height: 90 },
            });
          } catch (imgErr) {
            console.error('Failed to embed image', imgErr);
          }
        }
      }
      
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Checkins_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error('Export failed', err);
      alert('Failed to export to Excel.');
    }
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
            onClick={() => navigate('/')} 
            className="btn-ghost"
          >
            Go back to check-in
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
