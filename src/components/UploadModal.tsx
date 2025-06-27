'use client';

import { useState } from 'react';
import FileUpload from './FileUpload';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const handleFileUpload = async (file: File) => {
    console.log('File uploaded successfully:', file.name);
    // Close modal after successful upload
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Upload Documents</h2>
              <p className="text-sm text-gray-600 mt-1">
                Upload your documents to create an intelligent knowledge base
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <FileUpload
              onUpload={handleFileUpload}
              maxSize={10485760} // 10MB
              acceptedTypes={['application/pdf', 'text/plain']}
            />
            
            {/* Upload Instructions */}
            <div className="mt-6 space-y-3">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Accepted formats:</p>
                  <p className="text-sm text-gray-600">PDF and TXT files</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Maximum file size:</p>
                  <p className="text-sm text-gray-600">10MB</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Processing:</p>
                  <p className="text-sm text-gray-600">Files will be processed and added to the knowledge base</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 