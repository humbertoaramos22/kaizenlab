import React, { useState, useEffect } from 'react';
import { X, Globe, Plus, Trash2, CheckCircle } from 'lucide-react';
import { domainService } from '../../lib/supabase';
import { User, Domain, UserDomain } from '../../types';

interface ManageUserDomainsModalProps {
  user: User;
  userDomains: UserDomain[];
  availableDomains: Domain[];
  onClose: () => void;
  onDomainsUpdated: () => void;
}

export function ManageUserDomainsModal({ 
  user, 
  userDomains, 
  availableDomains, 
  onClose, 
  onDomainsUpdated 
}: ManageUserDomainsModalProps) {
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [currentUserDomains, setCurrentUserDomains] = useState(userDomains);

  const assignedDomainIds = currentUserDomains.map(ud => ud.domain_id);
  const unassignedDomains = availableDomains.filter(d => !assignedDomainIds.includes(d.id));

  const handleAssignDomain = async (domainId: string) => {
    setLoading(prev => ({ ...prev, [`assign-${domainId}`]: true }));
    
    try {
      const assignment = await domainService.assignDomainToUser(user.id, domainId);
      const domain = availableDomains.find(d => d.id === domainId);
      
      if (assignment && domain) {
        setCurrentUserDomains(prev => [...prev, { ...assignment, domain }]);
      }
    } catch (error) {
      console.error('Failed to assign domain:', error);
    } finally {
      setLoading(prev => ({ ...prev, [`assign-${domainId}`]: false }));
    }
  };

  const handleRemoveDomain = async (domainId: string) => {
    setLoading(prev => ({ ...prev, [`remove-${domainId}`]: true }));
    
    try {
      await domainService.removeDomainFromUser(user.id, domainId);
      setCurrentUserDomains(prev => prev.filter(ud => ud.domain_id !== domainId));
    } catch (error) {
      console.error('Failed to remove domain:', error);
    } finally {
      setLoading(prev => ({ ...prev, [`remove-${domainId}`]: false }));
    }
  };

  const handleClose = () => {
    onDomainsUpdated();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Manage Domain Access</h2>
            <p className="text-sm text-gray-600 mt-1">
              Configure domain access for {user.email}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          {/* Assigned Domains */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Assigned Domains ({currentUserDomains.length})
            </h3>
            
            {currentUserDomains.length > 0 ? (
              <div className="space-y-3">
                {currentUserDomains.map((userDomain) => (
                  <div key={userDomain.id} className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{userDomain.domain?.masked_name}</h4>
                        <p className="text-sm text-gray-600">
                          Assigned on {new Date(userDomain.assigned_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveDomain(userDomain.domain_id)}
                      disabled={loading[`remove-${userDomain.domain_id}`]}
                      className="flex items-center space-x-1 px-3 py-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="text-sm">
                        {loading[`remove-${userDomain.domain_id}`] ? 'Removing...' : 'Remove'}
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <Globe className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No domains assigned to this user</p>
              </div>
            )}
          </div>

          {/* Available Domains */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Available Domains ({unassignedDomains.length})
            </h3>
            
            {unassignedDomains.length > 0 ? (
              <div className="space-y-3">
                {unassignedDomains.map((domain) => (
                  <div key={domain.id} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="bg-gray-200 p-2 rounded-lg">
                        <Globe className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{domain.masked_name}</h4>
                        <p className="text-sm text-gray-600">
                          Created on {new Date(domain.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAssignDomain(domain.id)}
                      disabled={loading[`assign-${domain.id}`]}
                      className="flex items-center space-x-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="text-sm">
                        {loading[`assign-${domain.id}`] ? 'Assigning...' : 'Assign'}
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <Globe className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">All domains are already assigned to this user</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="w-full px-4 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}