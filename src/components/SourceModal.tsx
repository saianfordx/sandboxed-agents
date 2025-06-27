'use client';

import { useState } from 'react';

export interface SourceReference {
  title: string;
  content: string;
  source: string;
  pageNumber?: number;
  documentId?: string;
  chunkId?: string;
}

interface SourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  source: SourceReference | null;
}

export default function SourceModal({ isOpen, onClose, source }: SourceModalProps) {
  if (!isOpen || !source) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{source.title}</h2>
                <p className="text-sm text-gray-600">
                  {source.source}
                  {source.pageNumber && ` • Page ${source.pageNumber}`}
                </p>
              </div>
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
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Document Content:</h3>
              <div className="text-gray-800 whitespace-pre-wrap leading-relaxed text-sm">
                {source.content}
              </div>
            </div>

            {/* Metadata */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Document Information</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><span className="font-medium">Source:</span> {source.source}</p>
                  {source.pageNumber && (
                    <p><span className="font-medium">Page:</span> {source.pageNumber}</p>
                  )}
                  {source.documentId && (
                    <p><span className="font-medium">Document ID:</span> {source.documentId}</p>
                  )}
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Content Statistics</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><span className="font-medium">Length:</span> {source.content.length} characters</p>
                  <p><span className="font-medium">Words:</span> {source.content.split(/\s+/).length} words</p>
                  <p><span className="font-medium">Lines:</span> {source.content.split('\n').length} lines</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-500">
                This content was retrieved from your knowledge base using vector similarity search.
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 