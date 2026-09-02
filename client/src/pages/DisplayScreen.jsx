import React, { useState, useEffect, useRef } from 'react';
import { useCheckins } from '../hooks/useCheckins';
import DisplayCard from '../components/DisplayCard';

export default function DisplayScreen() {
  const { checkins } = useCheckins(5000);
  const [currentIndex, setCurrentIndex] = useState(0);
  const prevCountRef = useRef(0);

  // When a NEW check-in arrives, immediately jump to show it
  useEffect(() => {
    if (checkins.length > prevCountRef.current && prevCountRef.current > 0) {
      // A new photo was just uploaded — jump to it immediately
      setCurrentIndex(checkins.length - 1);
    }
    prevCountRef.current = checkins.length;
  }, [checkins.length]);

  // Auto-advance every 10 seconds, looping back to 0 after the last photo
  useEffect(() => {
    if (checkins.length === 0) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % checkins.length);
    }, 10000);

    return () => clearInterval(timer);
  }, [checkins.length, currentIndex]);

  // Keep index in bounds if checkins array shrinks
  useEffect(() => {
    if (checkins.length > 0 && currentIndex >= checkins.length) {
      setCurrentIndex(0);
    }
  }, [checkins.length, currentIndex]);

  return (
    <div className="display-screen">
      
      {checkins.length === 0 ? (
        <div className="display-empty">
          <div className="pulse-dot"></div>
          <p>Waiting for families to check in…</p>
          <p style={{ opacity: 0.5, fontSize: '1rem', marginTop: '10px' }}>
            No check-ins yet
          </p>
        </div>
      ) : (
        checkins[currentIndex] && (
          <DisplayCard 
            key={checkins[currentIndex].id}
            studentName={checkins[currentIndex].studentName}
            photoUrl={checkins[currentIndex].photoDataUrl}
            createdAt={checkins[currentIndex].createdAt}
          />
        )
      )}

    </div>
  );
}
