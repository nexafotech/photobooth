import React from 'react';

export default function DisplayCard({ studentName, photoUrl, createdAt }) {
  return (
    <div className="display-card" key={photoUrl}>
      <img 
        src={photoUrl} 
        alt={`Check-in for ${studentName}`} 
        className="display-card__photo" 
      />
    </div>
  );
}
