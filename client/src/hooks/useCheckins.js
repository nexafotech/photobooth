import { useState, useEffect, useRef } from 'react';
import api from '../lib/axios';

export function useCheckins(pollInterval = 5000) {
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const previousDataRef = useRef([]);

  const fetchCheckins = async () => {
    try {
      const response = await api.get('/api/checkins');
      const data = response.data;
      
      // Compare by checking lengths and stringified IDs (assuming checkins have an _id or id)
      // If data has changed, update state, otherwise keep reference stable
      const prevStr = JSON.stringify(previousDataRef.current.map(c => c.id || c._id));
      const newStr = JSON.stringify(data.map(c => c.id || c._id));
      
      if (prevStr !== newStr) {
        setCheckins(data);
        previousDataRef.current = data;
      }
      
      setError(null);
    } catch (err) {
      // Avoid overwriting generic error on 401 unauth
      if (err.response?.status !== 401) {
        setError(err.message || 'Failed to fetch checkins');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCheckins();
    
    const interval = setInterval(fetchCheckins, pollInterval);
    return () => clearInterval(interval);
  }, [pollInterval]);

  return { checkins, loading, error, refetch: fetchCheckins };
}
