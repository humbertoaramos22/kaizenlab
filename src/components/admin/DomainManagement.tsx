import React, { useState } from 'react';
import { Plus, Globe, Eye, Calendar, Image, Edit } from 'lucide-react';
import { Domain, User } from '../../types';
import { CreateDomainModal } from './CreateDomainModal';
import { EditDomainModal } from './EditDomainModal';

interface DomainManagementProps {
  domains: Domain[];
  currentUser: User;
  onDomainCreated: () => void;
  onDomainUpdated: () => void;
}

export function DomainManagement({ domains, currentUser, onDomainCreated, onDomainUpdated }: DomainManagementProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDomain, setEditingDomain] = useState<Domain | null>(null);
  const [showOriginal, setShowOriginal] = useState<{ [key: string]: boolean }>({});

  const toggleShowOriginal = (domainId: string) => {
    setShowOriginal(prev => ({
      ...prev,
      [domainId]: !prev[domainId]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Domain Management</h2>
          <p className="text-gray-600 mt-1">Create and manage domains with masked names for user access</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Domain</span>
        </button>
      </div>

      {/* Domains Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {domains.map((domain) => (
          <div key={domain.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-3">
                {domain.image_url ? (
                  <img
                    src={domain.image_url}
                    alt={domain.image_alt || domain.masked_name}
                    className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`bg-green-100 p-2 rounded-lg ${domain.image_url ? 'hidden' : ''}`}>
                  {domain.image_url ? (
                    <Image className="w-5 h-5 text-green-600" />
                  ) : (
                    <Globe className="w-5 h-5 text-green-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{domain.masked_name}</h3>
                  <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    Masked Name
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Original Domain:</span>
                  <button
                    onClick={() => toggleShowOriginal(domain.id)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-gray-900 font-mono">
                  {showOriginal[domain.id] 
                    ? domain.original_domain 
                    : '●'.repeat(domain.original_domain.length)
                  }
                </p>
              </div>

              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>Created {new Date(domain.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="mt-4">
              <button
                onClick={() => setEditingDomain(domain)}
                className="w-full flex items-center justify-center space-x-2 bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-lg transition-colors"
              >
                <Edit className="w-4 h-4" />
                <span>Edit Domain</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {domains.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No domains yet</h3>
          <p className="text-gray-600 mb-4">Add your first domain to get started</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors mx-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Domain</span>
          </button>
        </div>
      )}

      {/* Create Domain Modal */}
      {showCreateModal && (
        <CreateDomainModal
          currentUser={currentUser}
          onClose={() => setShowCreateModal(false)}
          onDomainCreated={() => {
            setShowCreateModal(false);
            onDomainCreated();
          }}
        />
      )}

      {/* Edit Domain Modal */}
      {editingDomain && (
        <EditDomainModal
          domain={editingDomain}
          currentUser={currentUser}
          onClose={() => setEditingDomain(null)}
          onDomainUpdated={() => {
            setEditingDomain(null);
            onDomainUpdated();
          }}
        />
      )}
    </div>
  );
}