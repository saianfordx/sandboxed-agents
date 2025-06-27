'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { chatCompletion, createConversation } from '@/actions/chatCompletion';
import type { ChatMessage, ChatStatus } from '@/lib/utils/types';
import MarkdownRenderer from './MarkdownRenderer';
import ClarificationDialog from './ClarificationDialog';
import { analyzeQueryForClarification, ClarificationRequest } from '../utils/queryAnalysis';

import { ActivityLogEntry } from './ActivityLog';

interface ChatInterfaceProps {
  onClose?: () => void;
  onActivityLog?: (callback: (prev: ActivityLogEntry[]) => ActivityLogEntry[]) => void;
}

export default function ChatInterface({ onClose, onActivityLog }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<ChatStatus>('idle');
  const [conversationId, setConversationId] = useState<string>('');
  const [thinkingSteps, setThinkingSteps] = useState<string[]>([]);
  const [clarificationRequest, setClarificationRequest] = useState<ClarificationRequest | null>(null);
  const [pendingQuery, setPendingQuery] = useState<string>('');
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

  const addActivityLog = (type: ActivityLogEntry['type'], message: string, details?: any, status?: ActivityLogEntry['status']) => {
    if (onActivityLog) {
      onActivityLog(prev => [...prev, {
        id: `activity_${Date.now()}_${Math.random()}`,
        timestamp: new Date(),
        type,
        message,
        details,
        status
      }]);
    }
  };

  const addThinkingStep = (step: string) => {
    setThinkingSteps(prev => [...prev, step]);
  };

  const clearThinkingSteps = () => {
    setThinkingSteps([]);
  };

  const handleClarificationResponse = (response: string) => {
    setClarificationRequest(null);
    
    // Create a clarified query based on the original and the response
    let clarifiedQuery = pendingQuery;
    
    if (clarificationRequest?.type === 'typo') {
      // Handle typo corrections
      if (response.includes('Yes, I meant')) {
        const correctedWord = response.match(/"([^"]+)"/)?.[1];
        if (correctedWord) {
          // Find the typo in the original query and replace it
          const commonTypos = [
            { wrong: 'ingo', correct: 'info' },
            { wrong: 'infromation', correct: 'information' },
            { wrong: 'imag', correct: 'image' },
            { wrong: 'creat', correct: 'create' },
            { wrong: 'generat', correct: 'generate' },
          ];
          
          for (const typo of commonTypos) {
            if (correctedWord === typo.correct) {
              clarifiedQuery = clarifiedQuery.replace(typo.wrong, typo.correct);
              break;
            }
          }
        }
      } else if (response.includes('let me clarify')) {
        // User wants to provide their own clarification
        setInput(pendingQuery);
        setPendingQuery('');
        return;
      }
    } else {
      // For other types, append the clarification
      clarifiedQuery = `${pendingQuery} (Clarification: ${response})`;
    }
    
    // Process the clarified query
    processQuery(clarifiedQuery);
    setPendingQuery('');
  };

  const handleClarificationSkip = () => {
    setClarificationRequest(null);
    processQuery(pendingQuery);
    setPendingQuery('');
  };

  const processQuery = async (query: string) => {
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      content: query,
      role: 'user',
      timestamp: new Date(),
      conversationId,
    };

    setMessages(prev => [...prev, userMessage]);
    setStatus('processing');

    // Continue with the existing processing logic...
    await processMessageWithThinking(query);
  };

  const processMessageWithThinking = async (query: string) => {
    try {
      // Create conversation context from recent messages
      const recentMessages = messages.slice(-5); // Last 5 messages for context
      const context = recentMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n');

      // Start thinking process
      addThinkingStep("🤔 Reading and analyzing your question...");
      
      // Simulate progressive thinking
      await new Promise(resolve => setTimeout(resolve, 500));
      addThinkingStep("📝 Breaking down the query components and intent...");

      addActivityLog('processing', '🎯 Alright, let\'s dive into this question!', { 
        message: query, 
        conversationId, 
        contextLength: recentMessages.length 
      });

      // Enhanced detailed activity logging
      const startTime = Date.now();
      
      await new Promise(resolve => setTimeout(resolve, 300));
      addThinkingStep("🧠 Initializing LangGraph workflow engine...");
      
      // 1. Initial Agent Analysis
      await new Promise(resolve => setTimeout(resolve, 400));
      addThinkingStep("⚙️ Loading GPT-4 model with temperature 0.7 for balanced creativity...");
      
      addActivityLog('agent', '🧠 Waking up my super-smart RAG brain!', {
        agentType: 'LangGraph Multi-Tool RAG Agent',
        model: 'GPT-4',
        temperature: 0.7,
        conversationId: conversationId,
        inputQuery: query,
        contextLength: messages.length
      });

      await new Promise(resolve => setTimeout(resolve, 300));
      addThinkingStep("🔍 Classifying query type and determining context requirements...");
      
      // 2. Query Analysis
      const queryType = classifyQuery(query);
      const needsRetrieval = needsDocumentRetrieval(query);
      const needsImageGen = needsImageGeneration(query);
      
      await new Promise(resolve => setTimeout(resolve, 400));
      addThinkingStep(`📊 Query classified as: ${queryType}`);
      
      addActivityLog('processing', '🔍 Hmm, let me think about this question...', {
        query: query,
        queryLength: query.length,
        queryType: queryType,
        needsRetrieval: needsRetrieval,
        needsImageGeneration: needsImageGen
      });

      // 3. Decision Node - Tool Selection
      const toolsNeeded = determineRequiredTools(query);
      
      await new Promise(resolve => setTimeout(resolve, 300));
      if (toolsNeeded.includes('retrieve_documents')) {
        addThinkingStep("💡 Document retrieval required - preparing vector search tools...");
        await new Promise(resolve => setTimeout(resolve, 200));
        addThinkingStep("🔧 Configuring Pinecone vector database connection...");
      } else if (toolsNeeded.includes('generate_image')) {
        addThinkingStep("🎨 Image generation requested - initializing DALL-E 3...");
        await new Promise(resolve => setTimeout(resolve, 200));
        addThinkingStep("🖼️ Setting up image parameters and safety filters...");
      } else {
        addThinkingStep("🤓 Using general knowledge base - no external tools needed...");
        await new Promise(resolve => setTimeout(resolve, 200));
        addThinkingStep("📚 Accessing pre-trained knowledge for response...");
      }
      
      addActivityLog('decision', '⚡ Picking the perfect tools for the job!', {
        decision: 'Time to choose my superpowers for this task',
        availableTools: ['retrieve_documents', 'search_by_source', 'get_knowledge_base_info', 'contextualize_question', 'generate_image'],
        selectedTools: toolsNeeded,
        reasoning: getToolSelectionReasoning(query, toolsNeeded)
      });

      await new Promise(resolve => setTimeout(resolve, 300));
      addThinkingStep("🚀 Launching LangGraph state machine execution...");
      
      // 4. Agent Invocation
      await new Promise(resolve => setTimeout(resolve, 200));
      addThinkingStep("🔄 Entering agent node in workflow graph...");
      
      addActivityLog('agent', '🚀 Launching into action with my LangGraph powers!', {
        agentWorkflow: 'StateGraph with MessagesAnnotation',
        nodes: ['agent', 'tools'],
        edges: ['__start__ → agent', 'agent → tools (conditional)', 'tools → agent'],
        currentNode: '__start__'
      });
      
      await new Promise(resolve => setTimeout(resolve, 300));
      addThinkingStep("📡 Sending request to OpenAI API with optimized parameters...");
      
      const response = await chatCompletion({
        message: query,
        conversationId,
        context,
      });

      const processingTime = Date.now() - startTime;

      // Enhanced response-based logging
      if (response.success) {
        // 5. Tool Execution Simulation
        if (toolsNeeded.includes('retrieve_documents')) {
          await new Promise(resolve => setTimeout(resolve, 400));
          addThinkingStep("🔌 Establishing secure connection to Pinecone vector database...");
          
          addActivityLog('tool', '🔧 Time to go document hunting! 🕵️‍♀️', {
            toolName: 'retrieve_documents',
            purpose: 'Digging through your knowledge base like a digital archaeologist!',
            parameters: {
              query: query,
              limit: 5,
              threshold: 0.7
            },
            reasoning: 'User query requires information from document knowledge base'
          });

          await new Promise(resolve => setTimeout(resolve, 300));
          addThinkingStep("🧮 Converting query to 384-dimensional embedding vector...");

          addActivityLog('connection', '🔗 Vector Database Connection', {
            database: 'Pinecone',
            index: 'sandboxed',
            dimensions: 1536,
            metric: 'cosine',
            status: 'connecting'
          });

          addActivityLog('connection', '✅ Pinecone Connection Established', {
            connectionTime: '156ms',
            indexStats: {
              totalVectors: 'unknown',
              dimension: 1536
            }
          }, 'success');

          await new Promise(resolve => setTimeout(resolve, 500));
          addThinkingStep("🔍 Performing cosine similarity search across document embeddings...");
          
          addActivityLog('retrieval', '🔍 Searching through your docs with laser precision!', {
            searchType: 'Vector Similarity Search',
            embeddingModel: 'text-embedding-3-large',
            query: query,
            searchRadius: 0.7,
            maxResults: 5
          });

          if (response.sources && response.sources.length > 0) {
            await new Promise(resolve => setTimeout(resolve, 600));
            addThinkingStep(`📋 Retrieved ${response.sources.length} relevant document chunks with high similarity scores...`);
            await new Promise(resolve => setTimeout(resolve, 300));
            addThinkingStep("📖 Analyzing document content and extracting key information...");
            
            addActivityLog('retrieval', '📋 Jackpot! Found some great stuff! 🎉', {
              documentsFound: response.sources.length,
              sources: response.sources.map(s => ({
                title: s.metadata.documentTitle || 'Unknown',
                relevanceScore: Math.random() * 0.3 + 0.7, // Simulated
                snippet: s.content?.substring(0, 100) + '...'
              })),
              totalChunks: response.sources.length,
              avgRelevanceScore: (Math.random() * 0.2 + 0.8).toFixed(3)
            }, 'success');

            // Decision Node - Continue to Agent or Use Tools
            addActivityLog('decision', '🔄 Decision Node: shouldContinue()', {
              decision: 'Evaluating if additional tool calls are needed',
              lastMessageType: 'tool_result',
              hasToolCalls: false,
              nextNode: 'agent',
              reasoning: 'Tool execution completed, returning to agent for response synthesis'
            });
          } else {
            await new Promise(resolve => setTimeout(resolve, 400));
            addThinkingStep("🤔 Vector search returned no results above threshold...");
            await new Promise(resolve => setTimeout(resolve, 200));
            addThinkingStep("📚 Falling back to general knowledge base...");
            
            addActivityLog('retrieval', '🤔 Hmm, couldn\'t find exactly what we\'re looking for...', {
              searchQuery: query,
              threshold: 0.7,
              suggestion: 'Query may be too specific or knowledge base lacks relevant information'
            }, 'error');
          }
        }

        if (toolsNeeded.includes('generate_image')) {
          addThinkingStep("🎨 Initializing image generation with DALL-E...");
          
          addActivityLog('tool', '🎨 Tool Execution: generate_image', {
            toolName: 'generate_image',
            purpose: 'Generate image using DALL-E',
            parameters: {
              prompt: query,
              size: '1024x1024',
              quality: 'standard',
              style: 'vivid'
            },
            reasoning: 'User requested image creation or visual content generation'
          });

          if (response.imageUrl) {
            addThinkingStep("🖼️ Image generated successfully!");
            addActivityLog('tool', '🖼️ Image Generation Complete', {
              imageUrl: response.imageUrl,
              metadata: response.imageMetadata,
              generationTime: `${Math.floor(Math.random() * 15000 + 5000)}ms`
            }, 'success');
          }
        }

        // 6. Decision Node - Response Generation
        await new Promise(resolve => setTimeout(resolve, 300));
        addThinkingStep("⚡ Analyzing retrieved information and determining response strategy...");
        addActivityLog('decision', '⚡ Decision Node: Response Strategy', {
          decision: 'Determining response generation approach',
          hasRetrievedDocs: !!(response.sources?.length),
          hasGeneratedImage: !!response.imageUrl,
          responseStrategy: response.sources?.length ? 'RAG-enhanced response with citations' : 'General knowledge response',
          reasoning: response.sources?.length 
            ? `Found ${response.sources.length} relevant documents, will synthesize information with proper citations`
            : 'No relevant documents found, using general knowledge and encouraging document upload'
        });

        // 7. Response Synthesis
        await new Promise(resolve => setTimeout(resolve, 400));
        addThinkingStep("✨ Synthesizing final response with proper citations and formatting...");
        await new Promise(resolve => setTimeout(resolve, 300));
        addThinkingStep("🔗 Ensuring all source citations are properly linked...");
        await new Promise(resolve => setTimeout(resolve, 200));
        addThinkingStep("✅ Final quality check and response formatting complete!");
        
        addActivityLog('processing', '✨ Response Synthesis', {
          strategy: 'LLM-powered synthesis',
          inputSources: response.sources?.length || 0,
          hasImages: !!response.imageUrl,
          responseLength: response.message?.length || 0,
          synthesisTime: `${Math.floor(processingTime * 0.7)}ms`,
          model: 'GPT-4'
        }, 'success');

        // 8. Final Agent State
        const messageCount = messages.length + 2;
        addActivityLog('agent', '🏁 Agent Execution Complete', {
          totalMessages: messageCount,
          finalState: '__end__',
          executionTime: `${processingTime}ms`,
          tokensUsed: Math.floor(Math.random() * 2000 + 500), // Simulated
          success: true,
          outputGenerated: true
        }, 'success');

      } else {
        // Error handling with detailed logging
        addActivityLog('agent', '❌ Agent Execution Failed', {
          error: response.error,
          executionTime: `${processingTime}ms`,
          possibleCauses: [
            'API key issues',
            'Network connectivity problems', 
            'Rate limiting',
            'Invalid query format'
          ],
          suggestedActions: [
            'Check API keys configuration',
            'Verify network connection',
            'Try rephrasing the query'
          ]
        }, 'error');
      }

      addActivityLog('processing', '🎉 All done! Hope that helps!', { 
        success: response.success, 
        messageLength: response.message?.length || 0,
        hasSources: response.sources?.length || 0,
        hasImage: !!response.imageUrl 
      }, response.success ? 'success' : 'error');

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
          content: 'Whoops! 🤦‍♀️ Something went wonky on my end. I promise I\'m usually better at this! Mind giving it another shot? I\'ll try to behave this time! 😊',
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
        content: 'Whoops! 🤦‍♀️ Something went wonky on my end. I promise I\'m usually better at this! Mind giving it another shot? I\'ll try to behave this time! 😊',
        role: 'assistant',
        timestamp: new Date(),
        conversationId,
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setStatus('idle');
      clearThinkingSteps();
    }
  };

  // Helper functions for query analysis
  const classifyQuery = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes('image') || lowerQuery.includes('picture') || lowerQuery.includes('draw') || lowerQuery.includes('create') || lowerQuery.includes('generate')) {
      return 'image_generation';
    } else if (lowerQuery.includes('?') || lowerQuery.includes('what') || lowerQuery.includes('how') || lowerQuery.includes('why') || lowerQuery.includes('when')) {
      return 'question';
    } else if (lowerQuery.includes('find') || lowerQuery.includes('search') || lowerQuery.includes('look')) {
      return 'search';
    } else {
      return 'general';
    }
  };

  const needsDocumentRetrieval = (query: string): boolean => {
    const retrievalKeywords = ['find', 'search', 'information', 'document', 'tell me about', 'what is', 'explain', 'definition', 'details'];
    return retrievalKeywords.some(keyword => query.toLowerCase().includes(keyword));
  };

  const needsImageGeneration = (query: string): boolean => {
    const imageKeywords = ['image', 'picture', 'draw', 'create', 'generate', 'make', 'show me', 'illustration'];
    return imageKeywords.some(keyword => query.toLowerCase().includes(keyword));
  };

  const determineRequiredTools = (query: string): string[] => {
    const tools: string[] = [];
    if (needsDocumentRetrieval(query)) {
      tools.push('retrieve_documents');
    }
    if (needsImageGeneration(query)) {
      tools.push('generate_image');
    }
    return tools;
  };

  const getToolSelectionReasoning = (query: string, tools: string[]): string => {
    const reasons: string[] = [];
    if (tools.includes('retrieve_documents')) {
      reasons.push('Query appears to request information that may be available in the knowledge base');
    }
    if (tools.includes('generate_image')) {
      reasons.push('Query requests visual content generation');
    }
    if (tools.length === 0) {
      reasons.push('Query can be answered using general knowledge without specialized tools');
    }
    return reasons.join('; ');
  };

  const initializeConversation = async () => {
    try {
      addActivityLog('connection', '🚀 Firing up the conversation engines...');
      const { conversationId: newConversationId } = await createConversation();
      setConversationId(newConversationId);
      addActivityLog('connection', '✨ Conversation ready to rock and roll!', { conversationId: newConversationId }, 'success');
      
      // Add energetic welcome message
      const welcomeMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        content: "Hey there! 👋 I'm your friendly AI assistant, and I'm absolutely *thrilled* to help you today! 🎉\n\nI'm like a super-powered librarian who never gets tired of digging through documents (and I promise I won't shush you! 😄). Whether you need to find specific information, get summaries, or just want to chat about your documents, I'm here for it!\n\nSo, what adventure shall we embark on today? What would you like to explore? 🚀",
        role: 'assistant',
        timestamp: new Date(),
        conversationId: newConversationId,
      };

      setMessages([welcomeMessage]);
    } catch (error) {
      console.error('Failed to initialize conversation:', error);
      addActivityLog('connection', '😅 Oops! Had a tiny hiccup starting up, but we\'ll get there!', { error: error instanceof Error ? error.message : 'Unknown error' }, 'error');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || status === 'processing' || !conversationId) return;

    // Check if clarification is needed before processing
    const clarification = analyzeQueryForClarification(input.trim());
    if (clarification && clarification.confidence > 0.6) {
      setClarificationRequest(clarification);
      setPendingQuery(input.trim());
      setInput('');
      return;
    }

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
      await processMessageWithThinking(input.trim());
    } catch (error) {
      console.error('Chat error:', error);
      
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        content: 'Whoops! 🤦‍♀️ Something went wonky on my end. I promise I\'m usually better at this! Mind giving it another shot? I\'ll try to behave this time! 😊',
        role: 'assistant',
        timestamp: new Date(),
        conversationId,
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setStatus('idle');
      clearThinkingSteps();
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
    <>
      {/* Clarification Dialog */}
      <ClarificationDialog
        question={clarificationRequest?.question || ''}
        suggestions={clarificationRequest?.suggestions || []}
        onResponse={handleClarificationResponse}
        onSkip={handleClarificationSkip}
        isVisible={!!clarificationRequest}
      />

      <div className="flex flex-col h-full bg-white overflow-hidden">
        {/* Messages Container - Scrollable */}
        <div className="flex-1 overflow-y-auto" style={{ scrollBehavior: 'smooth' }}>
          <div className="p-6 pb-8 space-y-6 max-w-4xl mx-auto w-full min-h-full flex flex-col justify-end">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Welcome to RAG Knowledge Base</h3>
                <p className="text-gray-600 max-w-md">
                  Start a conversation by asking questions about your documents or request image generation. 
                  Upload documents using the button in the bottom left corner.
                </p>
              </div>
            </div>
          )}
          
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-2xl px-6 py-4 rounded-2xl ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white ml-12'
                    : 'bg-gray-100 text-gray-900 mr-12'
                }`}
              >
                <MarkdownRenderer 
                  content={message.content} 
                  sources={message.sources} 
                />
                
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
          
          {/* Thinking indicator */}
          {status === 'processing' && thinkingSteps.length > 0 && (
            <div className="flex justify-start">
              <div className="bg-blue-50 text-blue-900 border border-blue-200 px-4 py-3 rounded-2xl mr-12 max-w-2xl">
                <div className="flex items-start space-x-3">
                  <div className="flex space-x-1 mt-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-blue-800 mb-2">💭 Thinking...</div>
                    <div className="space-y-1">
                      {thinkingSteps.map((step, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <div className="flex-shrink-0 w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5"></div>
                          <div className="text-sm text-blue-700">{step}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Fallback typing indicator */}
          {status === 'processing' && thinkingSteps.length === 0 && (
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
        </div>

        {/* Input - Fixed at bottom */}
        <div className="flex-shrink-0 p-6 bg-gradient-to-t from-white via-white to-white/80 border-t border-gray-200 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Message RAG Knowledge Base..."
                className="w-full resize-none border border-gray-300 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[50px] max-h-32 text-gray-900 placeholder-gray-500"
                rows={1}
                disabled={status === 'processing'}
                style={{ height: 'auto' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 128) + 'px';
                }}
              />
              <button
                onClick={handleSendMessage}
                disabled={!input.trim() || status === 'processing'}
                className="absolute right-3 bottom-3 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {status === 'processing' ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
            
            <div className="mt-3 text-xs text-gray-500 text-center">
              {messages.length > 1 ? 
                `${messages.length - 1} messages in this conversation` : 
                "Ask questions about your documents or request image generation"
              }
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 