import React, { useState } from 'react';
import { X, Globe, Eye, EyeOff, AlertCircle, Image, Upload, Trash2 } from 'lucide-react';
import { domainService } from '../../lib/supabase';
import { User } from '../../types';

interface CreateDomainModalProps {
  currentUser: User;
  onClose: () => void;
  onDomainCreated: () => void;
}

export function CreateDomainModal({ currentUser, onClose, onDomainCreated }: CreateDomainModalProps) {
  const [originalDomain, setOriginalDomain] = useState('');
  const [maskedName, setMaskedName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [imageAlt, setImageAlt] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be smaller than 5MB');
        return;
      }
      
      setSelectedFile(file);
      setError(null);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // First create the domain
      const domain = await domainService.createDomain(originalDomain, maskedName, currentUser.id);
      
      // If there's an image, upload it and update the domain
      if (selectedFile) {
        setUploading(true);
        const imageUrl = await domainService.uploadDomainImage(selectedFile, domain.id);
        await domainService.updateDomainImage(domain.id, imageUrl, imageAlt || null);
      }
      
      onDomainCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create domain');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  // Cleanup preview URL on unmount
  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add New Domain</h2>
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
              Original Domain
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="url"
                value={originalDomain}
                onChange={(e) => setOriginalDomain(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="https://example.com"
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              The actual domain URL that will be hidden from users
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Masked Name
            </label>
            <div className="relative">
              <EyeOff className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={maskedName}
                onChange={(e) => setMaskedName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Client Portal"
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              The friendly name users will see instead of the actual domain
            </p>
          </div>

          {/* Image Upload Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Domain Image (Optional)
            </label>
            
            {!selectedFile ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-1">Click to upload an image</p>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                </label>
              </div>
            ) : (
              <div className="border border-gray-300 rounded-lg p-4">
                <div className="flex items-center space-x-4">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {selectedFile && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image Description
              </label>
              <input
                type="text"
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Brief description of the image"
              />
              <p className="text-xs text-gray-500 mt-1">
                Helps with accessibility and SEO
              </p>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Preview:</h4>
            <div className="space-y-3">
              {previewUrl && (
                <div className="flex items-center space-x-3">
                  <img
                    src={previewUrl}
                    alt={imageAlt || maskedName || 'Domain image'}
                    className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Domain Image</p>
                    <p className="text-xs text-gray-500">
                      {imageAlt || 'No description provided'}
                    </p>
                  </div>
                </div>
              )}
              <div className="text-sm">
                <span className="text-gray-500">Users will see:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {maskedName || 'Client Portal'}
                </span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Actual domain:</span>
                <span className="ml-2 text-gray-600 font-mono">
                  {originalDomain || 'https://example.com'}
                </span>
              </div>
            </div>
          </div>

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
              disabled={loading || uploading}
              className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors"
            >
              {uploading ? 'Uploading...' : loading ? 'Adding...' : 'Add Domain'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}