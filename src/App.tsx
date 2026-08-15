import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './lib/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Melly from './pages/Melly';
import NotFound from './pages/NotFound';

function ProtectedRoute({ children, requireOwner = false }: { children: React.ReactNode, requireOwner?: boolean }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-cyan-400">Initializing...</div>;
  if (!user) return <Navigate to="/login" />;
  if (requireOwner && user.role !== 'owner') return <Navigate to="/404" />; // hide existence of melly
  
  return children;
}

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500/30">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        
        <Route path="/melly/*" element={
          <ProtectedRoute requireOwner={true}>
            <Melly />
          </ProtectedRoute>
        } />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}
