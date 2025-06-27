'use client';

import { useState } from 'react';
import ChatInterface from '@/components/ChatInterface';
import UploadModal from '@/components/UploadModal';
import ActivityLog, { ActivityLogEntry } from '@/components/ActivityLog';

export default function Home() {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [showActivityLog, setShowActivityLog] = useState(true);

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">RAG Knowledge Base</h1>
            <p className="text-sm text-gray-600">AI-powered document chat assistant</p>
          </div>
          
          {/* Header Actions */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowActivityLog(!showActivityLog)}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                showActivityLog 
                  ? 'text-purple-600 bg-purple-50 hover:bg-purple-100' 
                  : 'text-gray-600 bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Activity
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="hidden sm:flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area - Fixed Height Grid */}
      <div className="flex-1 grid grid-cols-1 overflow-hidden">
        {showActivityLog ? (
          /* Two-column layout when activity log is shown */
          <div className="grid grid-cols-3 h-full overflow-hidden">
            {/* Chat Area - 2/3 width */}
            <div className="col-span-2 h-full overflow-hidden">
              <ChatInterface onActivityLog={setActivityLog} />
            </div>
            
            {/* Activity Log Panel - 1/3 width */}
            <div className="col-span-1 h-full overflow-hidden border-l border-gray-200">
              <ActivityLog 
                entries={activityLog}
                isOpen={true}
                onToggle={() => setShowActivityLog(!showActivityLog)}
              />
            </div>
          </div>
        ) : (
          /* Full-width chat when activity log is hidden */
          <div className="h-full overflow-hidden">
            <ChatInterface onActivityLog={setActivityLog} />
          </div>
        )}
        
        {/* Floating Upload Button - Bottom Left */}
        <div className="fixed bottom-6 left-6 z-40">
          <div className="flex flex-col space-y-3">
            {/* Upload Documents Button */}
            <button
              onClick={() => setShowUploadModal(true)}
              className="group bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              title="Upload Documents"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </button>
            
            {/* Upload Label */}
            <div className="text-center">
              <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded-md shadow-sm">
                Upload
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
      />
    </div>
  );
}
