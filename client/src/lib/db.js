import { openDB } from 'idb';

const DB_NAME = 'photobooth_db';
const STORE_NAME = 'checkins';

// Initialize the database
export const initDB = async () => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('createdAt', 'createdAt');
      }
    },
  });
};

// Add a check-in
export const addCheckin = async (studentName, photoDataUrl) => {
  const db = await initDB();
  const record = {
    studentName,
    photoDataUrl,
    createdAt: new Date().toISOString(),
  };
  await db.add(STORE_NAME, record);
  // Notify other tabs
  const channel = new BroadcastChannel('checkins_channel');
  channel.postMessage({ type: 'NEW_CHECKIN', record });
  return record;
};

// Get all check-ins (sorted by created_at)
export const getCheckins = async () => {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const index = tx.store.index('createdAt');
  return index.getAll();
};

// Delete all check-ins
export const clearCheckins = async () => {
  const db = await initDB();
  await db.clear(STORE_NAME);
  // Notify other tabs
  const channel = new BroadcastChannel('checkins_channel');
  channel.postMessage({ type: 'CLEAR_CHECKINS' });
};
