'use client';

import { useState, useEffect } from 'react';
import ChatInterface from '@/components/ChatInterface';
import UploadModal from '@/components/UploadModal';
import ActivityLog, { ActivityLogEntry } from '@/components/ActivityLog';
import { deleteAllDocuments } from '@/actions/deleteAllDocuments';

export default function Home() {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [showActivityLog, setShowActivityLog] = useState(true);
  const [chatKey, setChatKey] = useState(0); // Key to force chat interface remount
  const [isDeleting, setIsDeleting] = useState(false);

  const clearConversation = () => {
    if (confirm('🗑️ Fresh Start Time!\n\nReady to wipe the slate clean and start a brand new conversation? This will permanently delete all our chat history (but hey, that means we get to meet again for the first time! 😄)\n\nShall we do this?')) {
      setChatKey(prev => prev + 1); // Force remount of ChatInterface
      setActivityLog([]); // Also clear activity log when starting fresh
    }
  };

  const clearActivityLog = () => {
    if (confirm('🗑️ Spring Cleaning Time!\n\nTime to tidy up that activity log! This will permanently delete all those behind-the-scenes details I\'ve been showing you. Don\'t worry though - I\'ll keep generating new ones as we chat!\n\nReady to clean house?')) {
      setActivityLog([]);
    }
  };

  const handleDeleteAllDocuments = async () => {
    const confirmed = confirm('🗑️ Delete ALL Documents\n\n⚠️ WARNING: This will permanently delete ALL documents from your knowledge base!\n\nThis action will:\n• Remove all uploaded documents\n• Delete all document chunks\n• Clear your entire vector database\n• Cannot be undone\n\nAre you absolutely sure you want to proceed?');
    
    if (!confirmed) return;

    try {
      setIsDeleting(true);
      const result = await deleteAllDocuments();
      
      if (result.success) {
        alert('✅ Success!\n\n' + result.message);
        // Also clear the conversation since the knowledge base is now empty
        setChatKey(prev => prev + 1);
        setActivityLog([]);
      } else {
        alert('❌ Error!\n\n' + (result.error || result.message));
      }
    } catch (error) {
      console.error('Delete all documents failed:', error);
      alert('❌ Error!\n\nFailed to delete documents: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsDeleting(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + D = Delete conversation
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        clearConversation();
      }
      // Ctrl/Cmd + Shift + L = Clear activity log
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'L') {
        event.preventDefault();
        clearActivityLog();
      }
      // Ctrl/Cmd + Shift + A = Toggle activity log
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'A') {
        event.preventDefault();
        setShowActivityLog(!showActivityLog);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showActivityLog]);

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
            {/* Clear Activity Log Button */}
            <button
              onClick={clearActivityLog}
              className="flex items-center px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
              title="Clear Activity Log (Ctrl+Shift+L)"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear Log
            </button>

            {/* Clear Conversation Button */}
            <button
              onClick={clearConversation}
              className="flex items-center px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
              title="Delete Conversation (Ctrl+Shift+D)"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.451c-.905-.545-1.94-.808-3.094-.808H3a1 1 0 01-1-1v-1.5c0-1.104.896-2 2-2h.5c.312 0 .625.074.909.214A10.986 10.986 0 0112 4c4.418 0 8 3.582 8 8z" />
              </svg>
              Clear Chat
            </button>

            {/* Toggle Activity Log Button */}
            <button
              onClick={() => setShowActivityLog(!showActivityLog)}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                showActivityLog 
                  ? 'text-purple-600 bg-purple-50 hover:bg-purple-100' 
                  : 'text-gray-600 bg-gray-50 hover:bg-gray-100'
              }`}
              title={`${showActivityLog ? 'Hide' : 'Show'} Activity Log (Ctrl+Shift+A)`}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {showActivityLog ? 'Hide Activity' : 'Show Activity'}
            </button>

            {/* Upload Button */}
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
              <ChatInterface key={chatKey} onActivityLog={setActivityLog} />
            </div>
            
            {/* Activity Log Panel - 1/3 width */}
            <div className="col-span-1 h-full overflow-hidden border-l border-gray-200">
              <ActivityLog 
                entries={activityLog}
                isOpen={true}
                onToggle={() => setShowActivityLog(!showActivityLog)}
                onClear={clearActivityLog}
              />
            </div>
          </div>
        ) : (
          /* Full-width chat when activity log is hidden */
          <div className="h-full overflow-hidden">
            <ChatInterface key={chatKey} onActivityLog={setActivityLog} />
          </div>
        )}
        
        {/* Floating Action Buttons - Bottom Left */}
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
            
            {/* Delete All Documents Button */}
            <button
              onClick={handleDeleteAllDocuments}
              disabled={isDeleting}
              className="group bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
              title="Delete ALL Documents"
            >
              {isDeleting ? (
                <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
            </button>
            
            {/* Button Labels */}
            <div className="text-center space-y-1">
              <span className="block text-xs text-gray-600 bg-white px-2 py-1 rounded-md shadow-sm">
                Upload
              </span>
              <span className="block text-xs text-gray-600 bg-white px-2 py-1 rounded-md shadow-sm">
                Delete All
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
