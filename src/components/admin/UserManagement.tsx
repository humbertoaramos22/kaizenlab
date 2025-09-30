import React, { useState } from 'react';
import { Plus, Eye, EyeOff, Globe, Trash2, Shield, User as UserIcon, Calendar, AlertTriangle, CreditCard as Edit, X, Ban, CheckCircle, Search } from 'lucide-react';
import { authService, domainService, userService } from '../../lib/supabase';
import { User, Domain, UserDomain } from '../../types';
import { CreateUserModal } from './CreateUserModal';
import { ManageUserDomainsModal } from './ManageUserDomainsModal';
import { EditUserModal } from './EditUserModal';

interface UserManagementProps {
  users: User[];
  domains: Domain[];
  onUserCreated: () => void;
  onUserUpdated: () => void;
}

export function UserManagement({ users, domains, onUserCreated, onUserUpdated }: UserManagementProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDomainsModal, setShowDomainsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);
  const [blockingUser, setBlockingUser] = useState<string | null>(null);
  const [userDomains, setUserDomains] = useState<UserDomain[]>([]);

  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleManageDomains = async (user: User) => {
    try {
      const domains = await domainService.getUserDomains(user.id);
      setUserDomains(domains || []);
      setSelectedUser(user);
      setShowDomainsModal(true);
    } catch (error) {
      console.error('Failed to load user domains:', error);
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleDeleteUser = async (userId: string) => {
    console.log('Starting user deletion for:', userId);
    setDeletingUser(userId);
    try {
      await userService.deleteUser(userId);
      console.log('User deletion successful, refreshing list...');
      setShowDeleteConfirm(null);
      onUserUpdated(); // This should refresh the user list
      console.log('User list refresh completed');
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Failed to delete user. Please try again.');
    } finally {
      setDeletingUser(null);
    }
  };

  const handleBlockUser = async (userId: string) => {
    console.log('handleBlockUser called for:', userId);
    setBlockingUser(userId);
    try {
      console.log('Calling userService.blockUser...');
      await userService.blockUser(userId);
      console.log('Block user successful, calling onUserUpdated...');
      onUserUpdated();
    } catch (error) {
      console.error('Failed to block user:', error);
      alert(`Failed to block user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setBlockingUser(null);
    }
  };

  const handleUnblockUser = async (userId: string) => {
    console.log('handleUnblockUser called for:', userId);
    setBlockingUser(userId);
    try {
      console.log('Calling userService.unblockUser...');
      await userService.unblockUser(userId);
      console.log('Unblock user successful, calling onUserUpdated...');
      onUserUpdated();
    } catch (error) {
      console.error('Failed to unblock user:', error);
      alert(`Failed to unblock user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setBlockingUser(null);
    }
  };

  const isExpired = (user: User) => {
    if (!user.expires_at) return false;
    return new Date(user.expires_at) < new Date();
  };

  const getExpirationStatus = (user: User) => {
    if (!user.expires_at) return null;
    
    const expirationDate = new Date(user.expires_at);
    const now = new Date();
    const daysUntilExpiration = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiration < 0) {
      return { status: 'expired', text: 'Expired', color: 'red' };
    } else if (daysUntilExpiration <= 7) {
      return { status: 'expiring', text: `${daysUntilExpiration} days left`, color: 'yellow' };
    } else {
      return { status: 'active', text: `${daysUntilExpiration} days left`, color: 'green' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-600 mt-1">
            Create and manage user accounts and their domain access
            {searchTerm && (
              <span className="ml-2 text-blue-600">
                • Showing {filteredUsers.length} of {users.length} users
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create User</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
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

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((user) => (
          <div key={user.id} className={`bg-white rounded-xl border p-6 hover:shadow-lg transition-shadow ${
            user.is_blocked ? 'border-orange-200 bg-orange-50' : 
            isExpired(user) ? 'border-red-200 bg-red-50' : 'border-gray-200'
          }`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${
                  user.role === 'admin' 
                    ? 'bg-purple-100 text-purple-600' 
                    : 'bg-blue-100 text-blue-600'
                }`}>
                  {user.role === 'admin' ? (
                    <Shield className="w-5 h-5" />
                  ) : (
                    <UserIcon className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{user.email}</h3>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    user.role === 'admin'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {user.role}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {user.is_blocked && (
                  <div className="bg-orange-100 p-1 rounded-lg">
                    <Ban className="w-4 h-4 text-orange-600" />
                  </div>
                )}
                {isExpired(user) && !user.is_blocked && (
                  <div className="bg-red-100 p-1 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  </div>
                )}
                <div className="bg-red-100 p-1 rounded-lg">
                  <button
                    onClick={() => setShowDeleteConfirm(user.id)}
                    className="text-red-600 hover:text-red-800 transition-colors"
                    title="Delete user"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Created:</span>
                <span className="text-gray-900">
                  {new Date(user.created_at).toLocaleDateString()}
                </span>
              </div>
              {user.last_login && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Last login:</span>
                  <span className="text-gray-900">
                    {new Date(user.last_login).toLocaleDateString()}
                  </span>
                </div>
              )}
              {user.expires_at && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Expires:</span>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-gray-400" />
                    <span className={`font-medium ${
                      getExpirationStatus(user)?.color === 'red' ? 'text-red-600' :
                      getExpirationStatus(user)?.color === 'yellow' ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {getExpirationStatus(user)?.text}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <button
                onClick={() => handleEditUser(user)}
                className="w-full flex items-center justify-center space-x-2 bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-lg transition-colors"
              >
                <Edit className="w-4 h-4" />
                <span>Edit User</span>
              </button>
              
              {!user.is_blocked ? (
                <button
                  onClick={() => handleBlockUser(user.id)}
                  disabled={blockingUser === user.id}
                  className="w-full flex items-center justify-center space-x-2 bg-orange-50 hover:bg-orange-100 text-orange-700 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Ban className="w-4 h-4" />
                  <span>{blockingUser === user.id ? 'Blocking...' : 'Block User'}</span>
                </button>
              ) : (
                <button
                  onClick={() => handleUnblockUser(user.id)}
                  disabled={blockingUser === user.id}
                  className="w-full flex items-center justify-center space-x-2 bg-green-50 hover:bg-green-100 text-green-700 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{blockingUser === user.id ? 'Unblocking...' : 'Unblock User'}</span>
                </button>
              )}
              
              {user.role !== 'admin' && !isExpired(user) && (
                <button
                  onClick={() => handleManageDomains(user)}
                  className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    user.is_blocked 
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                  }`}
                  disabled={user.is_blocked}
                >
                  <Globe className="w-4 h-4" />
                  <span>{user.is_blocked ? 'Domains (Blocked)' : 'Manage Domains'}</span>
                </button>
              )}
            </div>
            
            {user.is_blocked && (
              <div className="mt-4 w-full flex items-center justify-center space-x-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-lg">
                <Ban className="w-4 h-4" />
                <span className="text-sm font-medium">Account Blocked</span>
              </div>
            )}
            
            {!user.is_blocked && isExpired(user) && (
              <div className="mt-4 w-full flex items-center justify-center space-x-2 bg-red-100 text-red-700 px-4 py-2 rounded-lg">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">Account Expired</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {users.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No users yet</h3>
          <p className="text-gray-600 mb-4">Create your first user to get started</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors mx-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create User</span>
          </button>
        </div>
      ) : filteredUsers.length === 0 && searchTerm ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
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
      ) : null}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-red-100 p-2 rounded-lg">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete User</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete this user? This will permanently remove their account, 
                domain assignments, and all associated data.
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteUser(showDeleteConfirm)}
                  disabled={deletingUser === showDeleteConfirm}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors"
                >
                  {deletingUser === showDeleteConfirm ? 'Deleting...' : 'Delete User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onUserCreated={() => {
            setShowCreateModal(false);
            onUserCreated();
          }}
        />
      )}

      {showDomainsModal && selectedUser && (
        <ManageUserDomainsModal
          user={selectedUser}
          userDomains={userDomains}
          availableDomains={domains}
          onClose={() => setShowDomainsModal(false)}
          onDomainsUpdated={() => {
            setShowDomainsModal(false);
            onUserUpdated();
          }}
        />
      )}

      {showEditModal && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => setShowEditModal(false)}
          onUserUpdated={() => {
            setShowEditModal(false);
            onUserUpdated();
          }}
        />
      )}
    </div>
  );
}