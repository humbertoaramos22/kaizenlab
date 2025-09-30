import React, { useState, useEffect } from 'react';
import { Monitor, Users, Clock, Smartphone, Search, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ActiveUser {
  id: string;
  email: string;
  role: string;
  last_sign_in_at: string;
  created_at: string;
  is_blocked: boolean;
}

export function SessionMonitor() {
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadActiveUsers();
    const interval = setInterval(loadActiveUsers, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const loadActiveUsers = async () => {
    try {
      // Get all users who have logged in within the last 24 hours
      const { data: users, error } = await supabase
        .from('user_profiles')
        .select('*')
        .not('last_login', 'is', null)
        .gte('last_login', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('last_login', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our interface  
      const activeUsers: ActiveUser[] = (users || []).map(user => ({
        id: user.id,
        email: user.email,
        role: user.role,
        last_sign_in_at: user.last_login,
        created_at: user.created_at,
        is_blocked: user.is_blocked || false
      }));
      
      setActiveUsers(activeUsers);
    } catch (error) {
      console.error('Failed to load active users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on search term
  const filteredUsers = activeUsers.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const getStatusColor = (lastSignIn: string, isBlocked: boolean) => {
    if (isBlocked) return 'orange';
    
    const now = new Date();
    const signInTime = new Date(lastSignIn);
    const diffInMinutes = Math.floor((now.getTime() - signInTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 30) return 'green'; // Active (last 30 minutes)
    if (diffInMinutes < 120) return 'yellow'; // Recently active (last 2 hours)
    return 'gray'; // Inactive
  };

  const getStatusText = (lastSignIn: string, isBlocked: boolean) => {
    if (isBlocked) return 'Blocked';
    
    const now = new Date();
    const signInTime = new Date(lastSignIn);
    const diffInMinutes = Math.floor((now.getTime() - signInTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 30) return 'Active';
    if (diffInMinutes < 120) return 'Recently Active';
    return 'Inactive';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-blue-100 p-2 rounded-lg">
          <Monitor className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Recent User Activity</h3>
          <p className="text-sm text-gray-600">
            Monitor users who have signed in within the last 24 hours
            {searchTerm && (
              <span className="ml-2 text-blue-600">
                • Showing {filteredUsers.length} of {activeUsers.length} users
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            placeholder="Search users by email or role..."
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="mb-4 flex items-center space-x-4 text-sm">
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-gray-500" />
          <span className="text-gray-600">
            {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} with recent activity
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-gray-500" />
          <span className="text-gray-600">Auto-refresh every 10s</span>
        </div>
      </div>

      {filteredUsers.length > 0 ? (
        <div className="space-y-3">
          {filteredUsers.map((user) => {
            const statusColor = getStatusColor(user.last_sign_in_at, user.is_blocked);
            const statusText = getStatusText(user.last_sign_in_at, user.is_blocked);
            
            return (
            <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${
                  statusColor === 'green' ? 'bg-green-100' :
                  statusColor === 'yellow' ? 'bg-yellow-100' :
                  statusColor === 'orange' ? 'bg-orange-100' :
                  'bg-gray-100'
                }`}>
                  <Smartphone className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{user.email}</p>
                  <p className="text-sm text-gray-600">
                    {user.role} • Member since {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-2 mb-1">
                  <div className={`w-2 h-2 rounded-full ${
                    statusColor === 'green' ? 'bg-green-500' :
                    statusColor === 'yellow' ? 'bg-yellow-500' :
                    statusColor === 'orange' ? 'bg-orange-500' :
                    'bg-gray-500'
                  }`}></div>
                  <span className={`text-sm font-medium ${
                    statusColor === 'green' ? 'text-green-600' :
                    statusColor === 'yellow' ? 'text-yellow-600' :
                    statusColor === 'orange' ? 'text-orange-600' :
                    'text-gray-600'
                  }`}>{statusText}</span>
                </div>
                <p className="text-xs text-gray-500">
                  Last sign in: {getTimeAgo(user.last_sign_in_at)}
                </p>
              </div>
            </div>
          )})}
        </div>
      ) : activeUsers.length === 0 ? (
        <div className="text-center py-8">
          <Monitor className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No recent user activity</p>
        </div>
      ) : (
        <div className="text-center py-8">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No users found</h3>
          <p className="text-gray-600 mb-4">
            No users match your search for "{searchTerm}"
          </p>
          <button
            onClick={() => setSearchTerm('')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear search
          </button>
        </div>
      )}
    </div>
  );
}