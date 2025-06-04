'use client';

import { useState, useCallback } from 'react';
import { uploadDocument } from '@/actions/uploadDocument';
import type { FileUploadProps, FileUploadStatus } from '@/lib/utils/types';
import { isValidFile } from '@/lib/utils/fileProcessing';

export default function FileUpload({ 
  onUpload, 
  maxSize = 10485760, // 10MB
  acceptedTypes = ['application/pdf', 'text/plain'],
  disabled = false 
}: FileUploadProps) {
  const [status, setStatus] = useState<FileUploadStatus>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!isValidFile(file)) {
      setMessage('Invalid file. Please upload a PDF or TXT file (max 10MB).');
      setStatus('error');
      return;
    }

    let progressInterval: NodeJS.Timeout | undefined;

    try {
      setStatus('uploading');
      setUploadProgress(0);
      setMessage('Uploading file...');

      // Create FormData for the server action
      const formData = new FormData();
      formData.append('file', file);

      // Simulate upload progress
      progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            if (progressInterval) {
              clearInterval(progressInterval);
            }
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Call the server action
      console.log('Calling server action...');
      const result = await uploadDocument(formData);
      console.log('Server action completed:', result);

      if (progressInterval) {
        clearInterval(progressInterval);
      }
      setUploadProgress(100);

      if (result.success) {
        setStatus('success');
        setMessage(result.message);
        
        // Call the onUpload callback if provided
        if (onUpload) {
          await onUpload(file);
        }
      } else {
        setStatus('error');
        setMessage(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Upload failed');
      setUploadProgress(0);
    }
  }, [onUpload]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    if (disabled || status === 'uploading') return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [disabled, status, handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled && status !== 'uploading') {
      setIsDragOver(true);
    }
  }, [disabled, status]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  const resetUpload = useCallback(() => {
    setStatus('idle');
    setUploadProgress(0);
    setMessage('');
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'text-green-600 border-green-300 bg-green-50';
      case 'error':
        return 'text-red-600 border-red-300 bg-red-50';
      case 'uploading':
      case 'processing':
        return 'text-blue-600 border-blue-300 bg-blue-50';
      default:
        return 'text-gray-600 border-gray-300 bg-gray-50';
    }
  };

  const getDragOverColor = () => {
    if (isDragOver && !disabled && status !== 'uploading') {
      return 'border-blue-400 bg-blue-100';
    }
    return '';
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${getStatusColor()}
          ${getDragOverColor()}
          ${disabled || status === 'uploading' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-blue-400'}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => {
          if (!disabled && status !== 'uploading') {
            document.getElementById('file-input')?.click();
          }
        }}
      >
        <input
          id="file-input"
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || status === 'uploading'}
        />

        {/* Upload Icon */}
        <div className="mb-4">
          {status === 'uploading' || status === 'processing' ? (
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          ) : status === 'success' ? (
            <div className="h-12 w-12 mx-auto text-green-600">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          ) : status === 'error' ? (
            <div className="h-12 w-12 mx-auto text-red-600">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
          ) : (
            <div className="h-12 w-12 mx-auto text-gray-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
          )}
        </div>

        {/* Upload Text */}
        <div className="space-y-2">
          {status === 'idle' ? (
            <>
              <p className="text-lg font-medium">
                Drop your file here, or click to browse
              </p>
              <p className="text-sm">
                Supports PDF and TXT files up to {Math.round(maxSize / 1024 / 1024)}MB
              </p>
            </>
          ) : (
            <p className="text-sm font-medium">{message}</p>
          )}
        </div>

        {/* Progress Bar */}
        {(status === 'uploading' || status === 'processing') && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-xs mt-1">{uploadProgress}% complete</p>
          </div>
        )}

        {/* Action Buttons */}
        {(status === 'success' || status === 'error') && (
          <div className="mt-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                resetUpload();
              }}
              className="px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-600 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Upload Another File
            </button>
          </div>
        )}
      </div>

      {/* File Requirements */}
      <div className="mt-4 text-xs text-gray-500 space-y-1">
        <p>• Accepted formats: PDF, TXT</p>
        <p>• Maximum file size: {Math.round(maxSize / 1024 / 1024)}MB</p>
        <p>• Files will be processed and added to the knowledge base</p>
      </div>
    </div>
  );
} 