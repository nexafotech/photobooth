import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import CheckinForm from './pages/CheckinForm';
import Login from './pages/Login';
import DisplayScreen from './pages/DisplayScreen';
import { useAuth } from './hooks/useAuth';

import Admin from './pages/Admin';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="checkin-page">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/checkin" element={<CheckinForm />} />
        <Route path="/login" element={<Login />} />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/display" 
          element={
            <ProtectedRoute>
              <DisplayScreen />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
