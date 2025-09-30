import React, { useState, useEffect } from 'react';
import { Globe, LogOut, ExternalLink, Calendar, Lock, Clock, AlertTriangle, Ban, Image, Monitor } from 'lucide-react';
import { domainService, authService, supabase } from '../../lib/supabase';
import { User, UserDomain } from '../../types';

interface UserDashboardProps {
  currentUser: User;
  onLogout: () => void;
}

export function UserDashboard({ currentUser, onLogout }: UserDashboardProps) {
  const [userDomains, setUserDomains] = useState<UserDomain[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserDomains();
  }, []);

  const loadUserDomains = async () => {
    try {
      console.log('Loading domains for user:', currentUser.id);
      setLoading(true);
      const domains = await domainService.getUserDomains(currentUser.id);
      console.log('Loaded domains:', domains);
      setUserDomains(domains || []);
    } catch (error) {
      console.error('Failed to load user domains:', error);
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

  const handleAccessDomain = (domain: UserDomain) => {
    if (domain.domain?.original_domain) {
      window.open(domain.domain.original_domain, '_blank');
    }
  };

  const getExpirationInfo = () => {
    if (!currentUser.expires_at) return null;
    
    const expirationDate = new Date(currentUser.expires_at);
    const now = new Date();
    const timeRemaining = expirationDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));
    const hoursRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60));
    const minutesRemaining = Math.ceil(timeRemaining / (1000 * 60));
    
    // Determine if this is a trial (expires within 24 hours)
    const isTrial = timeRemaining > 0 && timeRemaining <= (24 * 60 * 60 * 1000);
    
    return {
      expirationDate,
      daysRemaining,
      hoursRemaining,
      minutesRemaining,
      isTrial,
      isExpired: daysRemaining < 0,
      isExpiringSoon: daysRemaining <= 7 && daysRemaining > 0,
      timeText: isTrial && timeRemaining > 0 
        ? (hoursRemaining > 1 ? `${hoursRemaining} hours` : `${minutesRemaining} minutes`)
        : `${Math.abs(daysRemaining)} days`
    };
  };

  const expirationInfo = getExpirationInfo();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your domains...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <img 
                src="/Screenshot 2025-09-29 084820.png" 
                alt="KaizenLib Logo" 
                className="w-40 h-30 object-contain"
              />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">My Apps</h1>
                <p className="text-sm text-gray-500">Access your application clicking on it</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {currentUser.email}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Account Information */}
        <div className={`rounded-xl p-4 mb-6 ${
          currentUser.is_blocked 
            ? 'bg-orange-50 border border-orange-200' 
            : 'bg-blue-50 border border-blue-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              currentUser.is_blocked ? 'bg-orange-100' : 'bg-blue-100'
            }`}>
              <Clock className={`w-5 h-5 ${
                currentUser.is_blocked ? 'text-orange-600' : 'text-blue-600'
              }`} />
            </div>
            <div className="flex-1">
              <h3 className={`font-semibold ${
                currentUser.is_blocked ? 'text-orange-800' : 'text-blue-800'
              }`}>Account Information</h3>
              <div className="flex items-center space-x-4 mt-1">
                <div className="flex items-center space-x-1">
                  <span className={`text-sm ${
                    currentUser.is_blocked ? 'text-orange-700' : 'text-blue-700'
                  }`}>Role: {currentUser.role}</span>
                </div>
                {currentUser.expires_at ? (
                  <>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className={`text-sm ${
                        expirationInfo?.isExpired 
                          ? 'text-red-700' 
                          : expirationInfo?.isExpiringSoon 
                            ? 'text-yellow-700'
                            : 'text-blue-700'
                      }`}>
                        Expires: {expirationInfo?.expirationDate.toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className={`text-sm font-medium ${
                        expirationInfo?.isExpired 
                          ? 'text-red-700' 
                          : expirationInfo?.isExpiringSoon || expirationInfo?.isTrial
                            ? 'text-yellow-700'
                            : 'text-blue-700'
                      }`}>
                        {expirationInfo?.isExpired 
                          ? `Expired ${expirationInfo?.timeText} ago`
                          : `${expirationInfo?.timeText} remaining`
                        }
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center space-x-1">
                    <span className="text-sm text-blue-700">No expiration date (permanent access)</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Expiration Warning Banner */}
        {currentUser.is_blocked ? (
          <div className="rounded-xl p-4 mb-6 bg-orange-50 border border-orange-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-orange-100">
                <Ban className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-orange-800">Account Blocked</h3>
                <p className="text-sm text-orange-700 mt-1">
                  Your account has been temporarily blocked. Please contact your administrator for assistance.
                </p>
              </div>
            </div>
          </div>
        ) : (
        currentUser.expires_at && (expirationInfo?.isExpired || expirationInfo?.isExpiringSoon || expirationInfo?.isTrial) && (
          <div className={`rounded-xl p-4 mb-6 ${
            expirationInfo?.isExpired 
              ? 'bg-red-50 border border-red-200' 
              : expirationInfo?.isTrial
                ? 'bg-orange-50 border border-orange-200'
                : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${
               expirationInfo?.isExpired 
                 ? 'bg-red-100' 
                 : expirationInfo?.isTrial
                   ? 'bg-orange-100'
                   : 'bg-yellow-100'
              }`}>
                <AlertTriangle className={`w-5 h-5 ${
                 expirationInfo?.isExpired 
                   ? 'text-red-600' 
                   : expirationInfo?.isTrial
                     ? 'text-orange-600'
                     : 'text-yellow-600'
                }`} />
              </div>
              <div className="flex-1">
                <h3 className={`font-semibold ${
                 expirationInfo?.isExpired 
                   ? 'text-red-800' 
                   : expirationInfo?.isTrial
                     ? 'text-orange-800'
                     : 'text-yellow-800'
                }`}>
                 {expirationInfo?.isExpired 
                   ? 'Account Expired' 
                   : expirationInfo?.isTrial
                     ? 'Trial Account'
                     : 'Account Expiring Soon'
                 }
                </h3>
                {expirationInfo?.isExpired ? (
                 <p className="text-sm text-red-700 mt-1">
                    Your account has expired. Please contact your administrator to renew access.
                  </p>
               ) : expirationInfo?.isTrial ? (
                 <p className="text-sm text-orange-700 mt-1">
                   You're using a trial account with {expirationInfo?.timeText} remaining. Contact your administrator to upgrade to a full account.
                 </p>
                ) : (
                 <p className="text-sm text-yellow-700 mt-1">
                    Your account will expire soon. Contact your administrator if you need to extend access.
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentUser.is_blocked ? (
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl shadow-xl p-12 max-w-md mx-auto">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Ban className="w-8 h-8 text-orange-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Account Blocked</h2>
              <p className="text-gray-600 mb-6">
                Your account has been temporarily blocked and you cannot access any domains at this time.
              </p>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-sm text-orange-800">
                  <strong>Need help?</strong><br />
                  Please contact your system administrator to resolve this issue and restore access to your account.
                </p>
              </div>
            </div>
          </div>
        ) : userDomains.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userDomains.map((userDomain) => (
              <div
                key={userDomain.id}
                className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-200 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {userDomain.domain?.image_url ? (
                      <img
                        src={userDomain.domain.image_url}
                        alt={userDomain.domain.image_alt || userDomain.domain.masked_name}
                        className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`bg-gradient-to-r from-blue-500 to-indigo-600 p-3 rounded-lg ${userDomain.domain?.image_url ? 'hidden' : ''}`}>
                      <Globe className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="bg-green-100 px-2 py-1 rounded-full">
                    <Lock className="w-4 h-4 text-green-600" />
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {userDomain.domain?.masked_name}
                  </h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Assigned {new Date(userDomain.assigned_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleAccessDomain(userDomain)}
                  className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-3 rounded-lg transition-all duration-200 group-hover:shadow-lg"
                >
                  <span>Access Resource</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl shadow-xl p-12 max-w-md mx-auto">
              <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Globe className="w-8 h-8 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">No Domains Assigned</h2>
              <p className="text-gray-600 mb-6">
                You don't have access to any domains yet. Contact your administrator to get access to resources.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Need access?</strong><br />
                  Reach out to your system administrator to request domain access.
                </p>
                </div>
            </div>
          </div>
        )}
      </div>

      {/* Session Notice */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Monitor className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-blue-800">
                <strong>Important Notice:</strong> All access is monitored and logged for security purposes. 
                Only one active session per user is allowed - logging in from another device will automatically 
                sign you out from previous sessions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}