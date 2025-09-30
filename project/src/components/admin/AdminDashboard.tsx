import React, { useState, useEffect } from 'react';
import { Users, Globe, Plus, Settings, LogOut } from 'lucide-react';
import { userService, domainService, authService } from '../../lib/supabase';
import { User, Domain } from '../../types';
import { UserManagement } from './UserManagement';
import { DomainManagement } from './DomainManagement';
import { SessionMonitor } from './SessionMonitor';

interface AdminDashboardProps {
  currentUser: User;
  onLogout: () => void;
}

export function AdminDashboard({ currentUser, onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'domains' | 'sessions'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('AdminDashboard: Loading data...');
      setLoading(true);
      
      // Check if Supabase is configured
      if (!userService || !domainService) {
        throw new Error('Services not available - check Supabase configuration');
      }
      
      const [usersData, domainsData] = await Promise.all([
        userService.getAllUsers(),
        domainService.getAllDomains(),
      ]);
      console.log('AdminDashboard: Loaded users:', usersData?.length, 'domains:', domainsData?.length);
      setUsers(usersData || []);
      setDomains(domainsData || []);
      console.log('AdminDashboard: State updated with users:', usersData?.length);
    } catch (error) {
      console.error('Failed to load data:', error);
      // Show user-friendly error message
      alert(`Failed to load data: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your internet connection and try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.signOut();
      onLogout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <img 
                src="/Screenshot 2025-09-29 084820.png" 
                alt="KaizenLib Logo" 
                className="w-40 h-30 object-contain"
              />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-500">Manage users and domains</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {currentUser.email}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="w-5 h-5" />
              <span>User Management</span>
              <span className="bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
                {users.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('domains')}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'domains'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Globe className="w-5 h-5" />
              <span>Domain Management</span>
              <span className="bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
                {domains.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'sessions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Settings className="w-5 h-5" />
              <span>Active Sessions</span>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="py-8">
          {activeTab === 'users' ? (
            <UserManagement 
              users={users} 
              domains={domains}
              onUserCreated={loadData}
              onUserUpdated={loadData}
            />
          ) : activeTab === 'domains' ? (
            <DomainManagement 
              domains={domains} 
              currentUser={currentUser}
              onDomainCreated={loadData}
              onDomainUpdated={loadData}
            />
          ) : (
            <SessionMonitor />
          )}
        </div>
      </div>
    </div>
  );
}