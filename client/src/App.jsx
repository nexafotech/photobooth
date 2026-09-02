import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CheckinForm from './pages/CheckinForm';
import DisplayScreen from './pages/DisplayScreen';
import Admin from './pages/Admin';
import Home from './pages/Home';

function App() {
  return (
    <Router basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/checkin" element={<CheckinForm />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/display" element={<DisplayScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
