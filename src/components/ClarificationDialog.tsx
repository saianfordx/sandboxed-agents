import React, { useState } from 'react';

interface ClarificationDialogProps {
  question: string;
  suggestions?: string[];
  onResponse: (response: string) => void;
  onSkip: () => void;
  isVisible: boolean;
}

export default function ClarificationDialog({ 
  question, 
  suggestions = [], 
  onResponse, 
  onSkip, 
  isVisible 
}: ClarificationDialogProps) {
  const [customResponse, setCustomResponse] = useState('');

  if (!isVisible) return null;

  const handleSuggestionClick = (suggestion: string) => {
    onResponse(suggestion);
  };

  const handleCustomSubmit = () => {
    if (customResponse.trim()) {
      onResponse(customResponse.trim());
      setCustomResponse('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCustomSubmit();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold">Quick Clarification 🤔</h3>
              <p className="text-blue-100 text-sm">I want to make sure I understand you perfectly!</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Question */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">AI</span>
              </div>
              <div className="flex-1">
                <p className="text-blue-900 font-medium mb-2">I noticed something in your request:</p>
                <p className="text-blue-800">{question}</p>
              </div>
            </div>
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div>
              <h4 className="text-gray-700 font-medium mb-3">Quick options:</h4>
              <div className="grid gap-2">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="text-left p-3 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full group-hover:bg-blue-500"></div>
                      <span className="text-gray-700 group-hover:text-blue-700">{suggestion}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Custom Response */}
          <div>
            <h4 className="text-gray-700 font-medium mb-3">Or tell me exactly what you meant:</h4>
            <div className="relative">
              <textarea
                value={customResponse}
                onChange={(e) => setCustomResponse(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your clarification here..."
                className="w-full resize-none border border-gray-300 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[80px] text-gray-900 placeholder-gray-500"
                rows={3}
              />
              <button
                onClick={handleCustomSubmit}
                disabled={!customResponse.trim()}
                className="absolute right-3 bottom-3 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
          <button
            onClick={onSkip}
            className="text-gray-600 hover:text-gray-800 font-medium transition-colors"
          >
            Skip - proceed anyway
          </button>
          <div className="text-sm text-gray-500">
            💡 This helps me give you better, more accurate responses!
          </div>
        </div>
      </div>
    </div>
  );
} 