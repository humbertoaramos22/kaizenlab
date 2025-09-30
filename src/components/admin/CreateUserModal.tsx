import React, { useState } from 'react';
import { X, User, Mail, Lock, AlertCircle, Calendar } from 'lucide-react';
import { authService } from '../../lib/supabase';

interface CreateUserModalProps {
  onClose: () => void;
  onUserCreated: () => void;
}

export function CreateUserModal({ onClose, onUserCreated }: CreateUserModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [durationType, setDurationType] = useState<'trial' | 'months'>('months');
  const [duration, setDuration] = useState<1 | 3 | 6 | 12>(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log('Creating user with email:', email, 'role:', role);
      console.log('About to call authService.signUp...');
      const finalDuration = durationType === 'trial' ? 'trial' : duration;
      await authService.signUp(email, password, role, finalDuration);
      console.log('User created successfully');
      onUserCreated();
    } catch (err) {
      console.error('User creation error:', err);
      console.error('Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        name: err instanceof Error ? err.name : 'Unknown',
        stack: err instanceof Error ? err.stack : 'No stack trace'
      });
      if (err instanceof Error) {
        if (err.message.includes('50 seconds') || err.message.includes('rate_limit')) {
          setError('Rate limit reached. Please wait 50 seconds before creating another user.');
        } else if (err.message.includes('User already registered')) {
          setError('A user with this email already exists.');
        } else if (err.message.includes('invalid') || err.message.includes('Invalid')) {
          setError(`Email validation error: ${err.message}`);
        } else {
          setError(`Failed to create user: ${err.message}`);
        }
      } else {
        setError('Failed to create user: Unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create New User</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="user@domain.com"
                required
                pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                title="Please enter a valid email address"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Use a valid email format (e.g., user@domain.com)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter password"
                required
                minLength={6}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              User Role
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="user"
                  checked={role === 'user'}
                  onChange={(e) => setRole(e.target.value as 'user')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <div className="ml-3">
                  <span className="text-sm font-medium text-gray-700">Regular User</span>
                  <p className="text-xs text-gray-500">Can access assigned domains</p>
                </div>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="admin"
                  checked={role === 'admin'}
                  onChange={(e) => setRole(e.target.value as 'admin')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <div className="ml-3">
                  <span className="text-sm font-medium text-gray-700">Administrator</span>
                  <p className="text-xs text-gray-500">Can manage users and domains</p>
                </div>
              </label>
            </div>
          </div>

          {role === 'user' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Type
              </label>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="trial"
                    checked={durationType === 'trial'}
                    onChange={(e) => setDurationType(e.target.value as 'trial')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <span className="text-sm font-medium text-gray-700">1-Hour Trial</span>
                    <p className="text-xs text-gray-500">Perfect for testing and demos</p>
                  </div>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="months"
                    checked={durationType === 'months'}
                    onChange={(e) => setDurationType(e.target.value as 'months')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <span className="text-sm font-medium text-gray-700">Monthly Subscription</span>
                    <p className="text-xs text-gray-500">Choose duration below</p>
                  </div>
                </label>
              </div>
              
              {durationType === 'months' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[1, 3, 6, 12].map((months) => (
                      <label key={months} className="flex items-center">
                        <input
                          type="radio"
                          value={months}
                          checked={duration === months}
                          onChange={(e) => setDuration(Number(e.target.value) as 1 | 3 | 6 | 12)}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {months} month{months > 1 ? 's' : ''}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              
              <p className="text-xs text-gray-500 mt-2">
                {durationType === 'trial' 
                  ? 'Account will expire after 1 hour'
                  : `Account will expire after ${duration} month${duration > 1 ? 's' : ''}`
                }
              </p>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}