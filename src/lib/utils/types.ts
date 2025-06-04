// Core application types for RAG application

export interface Document {
  id: string;
  filename: string;
  content: string;
  metadata: DocumentMetadata;
  uploadedAt: Date;
  processedAt?: Date;
  status: DocumentStatus;
}

export interface DocumentMetadata {
  originalName: string;
  mimeType: string;
  size: number;
  pageCount?: number;
  language?: string;
  source: string;
  chunkCount?: number;
}

export type DocumentStatus = 'uploading' | 'processing' | 'completed' | 'failed';

export interface DocumentChunk {
  id: string;
  documentId: string;
  content: string;
  metadata: ChunkMetadata;
  embedding?: number[];
  index: number;
}

export interface ChunkMetadata {
  startChar: number;
  endChar: number;
  pageNumber?: number;
  source: string;
  documentTitle: string;
}

// Chat and conversation types
export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  sources?: RetrievedDocument[];
  conversationId: string;
}

export interface RetrievedDocument {
  content: string;
  metadata: ChunkMetadata;
  score: number;
  documentId: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: ConversationMetadata;
}

export interface ConversationMetadata {
  messageCount: number;
  documentsReferenced: string[];
  lastActivity: Date;
}

// API request/response types
export interface UploadDocumentRequest {
  file: File;
}

export interface UploadDocumentResponse {
  success: boolean;
  documentId?: string;
  message: string;
  error?: string;
}

export interface ChatCompletionRequest {
  message: string;
  conversationId: string;
  context?: string;
}

export interface ChatCompletionResponse {
  success: boolean;
  message?: string;
  messageId?: string;
  sources?: RetrievedDocument[];
  error?: string;
}

// Configuration types
export interface PineconeConfig {
  apiKey: string;
  environment: string;
  indexName: string;
}

export interface OpenAIConfig {
  apiKey: string;
  embeddingModel: string;
  chatModel: string;
}

export interface LangSmithConfig {
  apiKey: string;
  projectName: string;
  tracingEnabled: boolean;
}

export interface AppConfig {
  maxFileSize: number;
  allowedFileTypes: string[];
  maxChunkSize: number;
  chunkOverlap: number;
  maxRetrievedDocs: number;
}

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: unknown;
  timestamp: Date;
}

export interface ValidationError extends AppError {
  field: string;
  value: unknown;
}

// Utility types
export type FileUploadStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'error';

export type ChatStatus = 'idle' | 'typing' | 'processing' | 'streaming' | 'error';

export interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;
}

// LangChain specific types
export interface ToolCall {
  name: string;
  args: Record<string, unknown>;
  result?: unknown;
}

export interface RetrievalToolInput {
  query: string;
  numResults?: number;
  filter?: Record<string, unknown>;
}

export interface RetrievalToolOutput {
  documents: RetrievedDocument[];
  totalResults: number;
  searchQuery: string;
}

// Component prop types
export interface FileUploadProps {
  onUpload?: (file: File) => Promise<void>;
  maxSize: number;
  acceptedTypes: string[];
  disabled?: boolean;
}

export interface ChatInterfaceProps {
  conversationId: string;
  onSendMessage: (message: string) => Promise<void>;
  messages: ChatMessage[];
  isLoading: boolean;
  disabled?: boolean;
}

export interface MessageListProps {
  messages: ChatMessage[];
  isStreaming?: boolean;
  onRetry?: (messageId: string) => void;
}

export interface ConversationHistoryProps {
  conversations: Conversation[];
  currentConversationId?: string;
  onSelectConversation: (conversationId: string) => void;
  onDeleteConversation: (conversationId: string) => void;
  onCreateConversation: () => void;
} 