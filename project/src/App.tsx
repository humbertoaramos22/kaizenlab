import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { LoginForm } from './components/auth/LoginForm';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { UserDashboard } from './components/user/UserDashboard';

function App() {
  const [refreshKey, setRefreshKey] = useState(0);
  const { user, loading, error } = useAuth(refreshKey);

  console.log('App render - user:', user, 'loading:', loading, 'error:', error);

  const handleLoginSuccess = () => {
    console.log('handleLoginSuccess called, refreshing auth state...');
    setRefreshKey(prev => prev + 1);
  };

  const handleLogout = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (loading) {
    console.log('App: Showing loading screen');
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading application...</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.log('App: Showing error screen');
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg">
          <h1 className="text-xl font-semibold text-red-600 mb-2">Authentication Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('App: Showing login form');
    return <LoginForm onLoginSuccess={handleLoginSuccess} />;
  }

  if (user.role === 'admin') {
    console.log('App: Showing admin dashboard');
    return <AdminDashboard currentUser={user} onLogout={handleLogout} />;
  }

  console.log('App: Showing user dashboard');
  return <UserDashboard currentUser={user} onLogout={handleLogout} />;
}

export default App;