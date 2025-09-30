import React, { useState } from 'react';
import { X, User, Mail, Shield, Calendar, AlertCircle, Clock } from 'lucide-react';
import { userService } from '../../lib/supabase';
import { User as UserType } from '../../types';

interface EditUserModalProps {
  user: UserType;
  onClose: () => void;
  onUserUpdated: () => void;
}

export function EditUserModal({ user, onClose, onUserUpdated }: EditUserModalProps) {
  const [role, setRole] = useState<'user' | 'admin'>(user.role);
  const [durationType, setDurationType] = useState<'trial' | 'months'>('months');
  const [duration, setDuration] = useState<1 | 3 | 6 | 12>(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let expiresAt = null;
      
      // If changing to user role, calculate new expiration date
      if (role === 'user') {
        const expiration = new Date();
        if (durationType === 'trial') {
          expiration.setHours(expiration.getHours() + 1);
        } else {
          expiration.setMonth(expiration.getMonth() + duration);
        }
        expiresAt = expiration.toISOString();
      }
      // If changing to admin role, remove expiration
      else if (role === 'admin') {
        expiresAt = null;
      }

      await userService.updateUser(user.id, {
        role,
        expires_at: expiresAt,
      });

      onUserUpdated();
    } catch (err) {
      console.error('User update error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const isExpired = user.expires_at && new Date(user.expires_at) < new Date();
  const currentExpirationDate = user.expires_at ? new Date(user.expires_at) : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit User</h2>
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

          {/* User Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{user.email}</h3>
                <p className="text-sm text-gray-600">
                  Created {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
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
                  ? 'New expiration will be 1 hour from now'
                  : `New expiration date will be ${duration} month${duration > 1 ? 's' : ''} from today`
                }
              </p>
            </div>
          )}

          {/* Current Status */}
          {(user.expires_at || isExpired) && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Current Status
              </h4>
              {currentExpirationDate && (
                <div className="text-sm">
                  <span className="text-gray-600">Current expiration:</span>
                  <span className={`ml-2 font-medium ${isExpired ? 'text-red-600' : 'text-gray-900'}`}>
                    {currentExpirationDate.toLocaleDateString()}
                    {isExpired && ' (Expired)'}
                  </span>
                </div>
              )}
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
              {loading ? 'Updating...' : 'Update User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}