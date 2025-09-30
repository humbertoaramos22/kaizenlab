import React, { useState } from 'react';
import { X, Globe, Image, Upload, Trash2, AlertCircle } from 'lucide-react';
import { domainService } from '../../lib/supabase';
import { Domain, User } from '../../types';

interface EditDomainModalProps {
  domain: Domain;
  currentUser: User;
  onClose: () => void;
  onDomainUpdated: () => void;
}

export function EditDomainModal({ domain, currentUser, onClose, onDomainUpdated }: EditDomainModalProps) {
  const [maskedName, setMaskedName] = useState(domain.masked_name);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [imageAlt, setImageAlt] = useState(domain.image_alt || '');
  const [removeCurrentImage, setRemoveCurrentImage] = useState(false);
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
      setRemoveCurrentImage(false);
      setError(null);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleRemoveNewImage = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
    }
  };

  const handleRemoveCurrentImage = () => {
    setRemoveCurrentImage(true);
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
      let newImageUrl = domain.image_url;
      
      // Handle image changes
      if (removeCurrentImage) {
        // Remove current image
        if (domain.image_url) {
          await domainService.deleteDomainImage(domain.image_url);
        }
        newImageUrl = null;
      } else if (selectedFile) {
        // Upload new image
        setUploading(true);
        
        // Delete old image if it exists
        if (domain.image_url) {
          await domainService.deleteDomainImage(domain.image_url);
        }
        
        // Upload new image
        newImageUrl = await domainService.uploadDomainImage(selectedFile, domain.id);
      }
      
      // Update domain
      await domainService.updateDomainImage(domain.id, newImageUrl, imageAlt || null);
      
      onDomainUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update domain');
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
          <h2 className="text-xl font-semibold text-gray-900">Edit Domain</h2>
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
              Domain Name
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={domain.original_domain}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                disabled
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Original domain cannot be changed
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Masked Name
            </label>
            <input
              type="text"
              value={maskedName}
              onChange={(e) => setMaskedName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Client Portal"
              required
            />
          </div>

          {/* Current Image */}
          {domain.image_url && !removeCurrentImage && !selectedFile && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Image
              </label>
              <div className="border border-gray-300 rounded-lg p-4">
                <div className="flex items-center space-x-4">
                  <img
                    src={domain.image_url}
                    alt={domain.image_alt || domain.masked_name}
                    className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Current domain image</p>
                    <p className="text-xs text-gray-500">
                      {domain.image_alt || 'No description'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCurrentImage}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Image Upload Section */}
          {(!domain.image_url || removeCurrentImage) && !selectedFile && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload New Image
              </label>
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
            </div>
          )}

          {/* New Image Preview */}
          {selectedFile && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Image
              </label>
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
                    onClick={handleRemoveNewImage}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {(selectedFile || (domain.image_url && !removeCurrentImage)) && (
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
              {uploading ? 'Uploading...' : loading ? 'Updating...' : 'Update Domain'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}