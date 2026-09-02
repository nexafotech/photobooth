import { useState, useEffect } from 'react';
import { getCheckins } from '../lib/db';

export function useCheckins() {
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCheckins = async () => {
    try {
      setLoading(true);
      const data = await getCheckins();
      // Sort by newest first
      data.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      setCheckins(data);
    } catch (err) {
      setError('Failed to fetch checkins');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCheckins();

    // Listen for new checkins from other tabs
    const channel = new BroadcastChannel('checkins_channel');
    channel.onmessage = (event) => {
      if (event.data.type === 'NEW_CHECKIN') {
        setCheckins((prev) => [...prev, event.data.record]);
      } else if (event.data.type === 'CLEAR_CHECKINS') {
        setCheckins([]);
      }
    };

    return () => {
      channel.close();
    };
  }, []);

  return { checkins, loading, error, refetch: fetchCheckins };
}
