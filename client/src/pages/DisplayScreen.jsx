import React, { useState, useEffect } from 'react';
import { useCheckins } from '../hooks/useCheckins';
import DisplayCard from '../components/DisplayCard';

export default function DisplayScreen() {
  const { checkins } = useCheckins(5000);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-advance logic: act as a queue
  useEffect(() => {
    if (currentIndex >= checkins.length) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => prev + 1);
    }, 10000); // 10 seconds

    return () => clearInterval(timer);
  }, [checkins.length, currentIndex]);

  // Prevent index from going completely out of bounds if checkins array shrinks unexpectedly
  useEffect(() => {
    if (currentIndex > checkins.length) {
      setCurrentIndex(checkins.length);
    }
  }, [checkins.length, currentIndex]);

  return (
    <div className="display-screen">
      
      {currentIndex >= checkins.length ? (
        <div className="display-empty">
          <div className="pulse-dot"></div>
          <p>Waiting for families to check in…</p>
          <p style={{ opacity: 0.5, fontSize: '1rem', marginTop: '10px' }}>
            {checkins.length === 0 ? "No check-ins yet" : "All caught up!"}
          </p>
        </div>
      ) : (
        checkins[currentIndex] && (
          <DisplayCard 
            studentName={checkins[currentIndex].studentName}
            photoUrl={checkins[currentIndex].photoUrl}
            createdAt={checkins[currentIndex].createdAt}
          />
        )
      )}

    </div>
  );
}
