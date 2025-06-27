'use client';

import { useState } from 'react';

export interface ActivityLogEntry {
  id: string;
  timestamp: Date;
  type: 'agent' | 'tool' | 'retrieval' | 'connection' | 'processing' | 'decision';
  message: string;
  details?: any;
  status?: 'running' | 'success' | 'error';
}

interface ActivityLogProps {
  entries: ActivityLogEntry[];
  isOpen: boolean;
  onToggle: () => void;
}

export default function ActivityLog({ entries, isOpen, onToggle }: ActivityLogProps) {
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());

  const toggleEntryExpansion = (entryId: string) => {
    const newExpanded = new Set(expandedEntries);
    if (newExpanded.has(entryId)) {
      newExpanded.delete(entryId);
    } else {
      newExpanded.add(entryId);
    }
    setExpandedEntries(newExpanded);
  };

  const getTypeIcon = (type: ActivityLogEntry['type']) => {
    switch (type) {
      case 'agent':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        );
      case 'tool':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case 'retrieval':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        );
      case 'connection':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        );
      case 'processing':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        );
      case 'decision':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getTypeColor = (type: ActivityLogEntry['type'], status?: string) => {
    const baseColors = {
      agent: 'text-purple-600 bg-purple-50',
      tool: 'text-blue-600 bg-blue-50',
      retrieval: 'text-green-600 bg-green-50',
      connection: 'text-orange-600 bg-orange-50',
      processing: 'text-gray-600 bg-gray-50',
      decision: 'text-yellow-600 bg-yellow-50'
    };

    if (status === 'error') {
      return 'text-red-600 bg-red-50';
    }

    return baseColors[type] || 'text-gray-600 bg-gray-50';
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      fractionalSecondDigits: 3 
    });
  };

  return (
    <div className="bg-white flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
        <button
          onClick={onToggle}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <h3 className="text-sm font-semibold text-gray-900">Activity Log</h3>
            <span className="text-xs text-gray-500">({entries.length})</span>
          </div>
          <svg 
            className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Content */}
      {isOpen && (
        <div 
          className="flex-1 overflow-y-auto p-3 space-y-2 text-xs"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#d1d5db #f3f4f6'
          }}
        >
          {entries.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <div className="w-8 h-8 mx-auto mb-2 text-gray-300">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p>No activity yet</p>
              <p className="text-gray-400">Start chatting to see agent activity</p>
            </div>
          ) : (
            entries.slice(-50).map((entry) => (
              <div key={entry.id} className="border border-gray-200 rounded-lg">
                <div
                  className={`p-3 rounded-lg cursor-pointer hover:bg-gray-50 ${getTypeColor(entry.type, entry.status)}`}
                  onClick={() => toggleEntryExpansion(entry.id)}
                >
                  <div className="flex items-start space-x-2">
                    <div className="flex-shrink-0 mt-0.5">
                      {getTypeIcon(entry.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium capitalize">{entry.type}</span>
                        <span className="text-gray-500">{formatTimestamp(entry.timestamp)}</span>
                      </div>
                      <p className="mt-1 text-gray-700 break-words">{entry.message}</p>
                      {entry.status && (
                        <div className="mt-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            entry.status === 'success' ? 'bg-green-100 text-green-800' :
                            entry.status === 'error' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {entry.status}
                          </span>
                        </div>
                      )}
                    </div>
                    {entry.details && (
                      <div className="flex-shrink-0">
                        <svg 
                          className={`w-3 h-3 text-gray-400 transition-transform ${
                            expandedEntries.has(entry.id) ? 'rotate-180' : ''
                          }`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Expanded Details */}
                {expandedEntries.has(entry.id) && entry.details && (
                  <div className="px-3 pb-3">
                    <div className="bg-gray-50 rounded p-2 border-t border-gray-200">
                      <pre className="text-xs text-gray-600 whitespace-pre-wrap overflow-x-auto">
                        {typeof entry.details === 'string' 
                          ? entry.details 
                          : JSON.stringify(entry.details, null, 2)
                        }
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
} 