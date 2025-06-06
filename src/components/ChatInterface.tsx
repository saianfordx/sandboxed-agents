'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { chatCompletion, createConversation } from '@/actions/chatCompletion';
import type { ChatMessage, ChatStatus } from '@/lib/utils/types';

interface ChatInterfaceProps {
  onClose?: () => void;
}

export default function ChatInterface({ onClose }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<ChatStatus>('idle');
  const [conversationId, setConversationId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Initialize conversation
  useEffect(() => {
    initializeConversation();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeConversation = async () => {
    try {
      const { conversationId: newConversationId } = await createConversation();
      setConversationId(newConversationId);
      
      // Add welcome message
      const welcomeMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        content: "Hello! I'm your AI assistant. I can help you find information from your uploaded documents and generate images. What would you like to know or create?",
        role: 'assistant',
        timestamp: new Date(),
        conversationId: newConversationId,
      };
      
      setMessages([welcomeMessage]);
    } catch (error) {
      console.error('Failed to initialize conversation:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || status === 'processing' || !conversationId) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      content: input.trim(),
      role: 'user',
      timestamp: new Date(),
      conversationId,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setStatus('processing');

    try {
      // Create conversation context from recent messages
      const recentMessages = messages.slice(-5); // Last 5 messages for context
      const context = recentMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n');

      const response = await chatCompletion({
        message: input.trim(),
        conversationId,
        context,
      });

      if (response.success && response.message) {
        const assistantMessage: ChatMessage = {
          id: response.messageId || `msg_${Date.now()}`,
          content: response.message,
          role: 'assistant',
          timestamp: new Date(),
          conversationId,
          sources: response.sources,
          imageUrl: response.imageUrl,
          imageMetadata: response.imageMetadata,
        };
        
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        const errorMessage: ChatMessage = {
          id: `msg_${Date.now()}`,
          content: `Sorry, I encountered an error: ${response.error || 'Unknown error'}`,
          role: 'assistant',
          timestamp: new Date(),
          conversationId,
        };
        
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        content: 'Sorry, I encountered an error while processing your message.',
        role: 'assistant',
        timestamp: new Date(),
        conversationId,
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setStatus('idle');
    }
  }, [input, status, conversationId, messages]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-blue-50">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">AI Assistant</h2>
          <p className="text-sm text-gray-600">Ask questions about your documents or request image generation</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900 border border-gray-200'
              }`}
            >
              <div className="whitespace-pre-wrap break-words">{message.content}</div>
              
              {/* Generated Image */}
              {message.imageUrl && (
                <div className="mt-3">
                  <img 
                    src={message.imageUrl} 
                    alt={message.imageMetadata?.originalPrompt || "Generated image"}
                    className="max-w-full h-auto rounded-lg border border-gray-200 shadow-sm"
                    loading="lazy"
                  />
                  {message.imageMetadata && (
                    <div className="mt-2 text-xs text-gray-500">
                      <div>Original prompt: {message.imageMetadata.originalPrompt}</div>
                      {message.imageMetadata.revisedPrompt && (
                        <div>Refined prompt: {message.imageMetadata.revisedPrompt}</div>
                      )}
                      <div>Size: {message.imageMetadata.size} | Quality: {message.imageMetadata.quality} | Style: {message.imageMetadata.style}</div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Sources */}
              {message.sources && message.sources.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-300">
                  <p className="text-xs text-gray-600 mb-1">Sources:</p>
                  {message.sources.map((source, index) => (
                    <div key={index} className="text-xs text-gray-500">
                      • {source.metadata.documentTitle || source.metadata.source}
                      {source.metadata.pageNumber && ` (Page ${source.metadata.pageNumber})`}
                    </div>
                  ))}
                </div>
              )}
              
              <div className={`text-xs mt-1 ${
                message.role === 'user' ? 'text-blue-200' : 'text-gray-500'
              }`}>
                {formatTimestamp(message.timestamp)}
              </div>
            </div>
          </div>
        ))}
        
        {/* Typing indicator */}
        {status === 'processing' && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 border border-gray-200 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-1">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-gray-600 ml-2">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex space-x-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
            className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={1}
            disabled={status === 'processing'}
          />
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || status === 'processing'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {status === 'processing' ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
        
        <div className="mt-2 text-xs text-gray-500">
          {messages.length > 1 && `${messages.length - 1} messages in this conversation`}
        </div>
      </div>
    </div>
  );
} 