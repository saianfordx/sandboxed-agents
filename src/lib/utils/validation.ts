import { z } from 'zod';

// File upload validation schemas
export const FileUploadSchema = z.object({
  name: z.string().min(1, 'Filename cannot be empty'),
  size: z.number().max(10485760, 'File size cannot exceed 10MB'), // 10MB in bytes
  type: z.enum(['application/pdf', 'text/plain'], {
    errorMap: () => ({ message: 'Only PDF and TXT files are allowed' }),
  }),
});

export const DocumentUploadSchema = z.object({
  file: z.instanceof(File).refine(
    (file) => {
      const result = FileUploadSchema.safeParse({
        name: file.name,
        size: file.size,
        type: file.type,
      });
      return result.success;
    },
    {
      message: 'Invalid file. Must be PDF or TXT, max 10MB',
    }
  ),
});

// Chat message validation schemas
export const ChatMessageSchema = z.object({
  content: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(4000, 'Message cannot exceed 4000 characters')
    .trim(),
  conversationId: z.string().uuid('Invalid conversation ID'),
  context: z.string().optional(),
});

export const ConversationIdSchema = z.string().uuid('Invalid conversation ID');

// Document processing validation schemas
export const DocumentChunkSchema = z.object({
  content: z.string().min(1, 'Chunk content cannot be empty'),
  metadata: z.object({
    startChar: z.number().min(0),
    endChar: z.number().min(0),
    pageNumber: z.number().min(1).optional(),
    source: z.string().min(1),
    documentTitle: z.string().min(1),
  }),
  index: z.number().min(0),
});

// Retrieval tool validation schemas
export const RetrievalToolInputSchema = z.object({
  query: z
    .string()
    .min(1, 'Search query cannot be empty')
    .max(1000, 'Search query cannot exceed 1000 characters')
    .trim(),
  numResults: z.number().min(1).max(20).default(5),
  filter: z.record(z.unknown()).optional(),
});

// Configuration validation schemas
export const EnvironmentConfigSchema = z.object({
  OPENAI_API_KEY: z.string().min(1, 'OpenAI API key is required'),
  PINECONE_API_KEY: z.string().min(1, 'Pinecone API key is required'),
  PINECONE_ENVIRONMENT: z.string().min(1, 'Pinecone environment is required'),
  PINECONE_INDEX_NAME: z.string().min(1, 'Pinecone index name is required'),
  LANGCHAIN_TRACING_V2: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  LANGCHAIN_API_KEY: z.string().optional(),
  LANGCHAIN_PROJECT: z.string().optional(),
  NEXT_PUBLIC_MAX_FILE_SIZE: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive()),
  NEXT_PUBLIC_ALLOWED_FILE_TYPES: z.string().min(1),
});

export const AppConfigSchema = z.object({
  maxFileSize: z.number().positive().max(10485760), // 10MB max
  allowedFileTypes: z.array(z.string()).min(1),
  maxChunkSize: z.number().min(500).max(2000).default(1500),
  chunkOverlap: z.number().min(50).max(500).default(200),
  maxRetrievedDocs: z.number().min(1).max(20).default(5),
});

// Search and query validation schemas
export const SearchQuerySchema = z.object({
  query: z
    .string()
    .min(1, 'Search query cannot be empty')
    .max(500, 'Search query cannot exceed 500 characters')
    .trim(),
  filters: z.record(z.unknown()).optional(),
  limit: z.number().min(1).max(50).default(10),
});

// Pagination validation schemas
export const PaginationSchema = z.object({
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(20),
});

// ID validation schemas
export const UUIDSchema = z.string().uuid('Invalid UUID format');
export const DocumentIdSchema = UUIDSchema;
export const MessageIdSchema = UUIDSchema;

// API response validation schemas
export const APIResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  error: z.string().optional(),
  data: z.unknown().optional(),
});

export const UploadResponseSchema = APIResponseSchema.extend({
  documentId: z.string().uuid().optional(),
});

export const ChatResponseSchema = APIResponseSchema.extend({
  messageId: z.string().uuid().optional(),
  sources: z
    .array(
      z.object({
        content: z.string(),
        metadata: z.object({
          source: z.string(),
          documentTitle: z.string(),
          pageNumber: z.number().optional(),
        }),
        score: z.number(),
        documentId: z.string().uuid(),
      })
    )
    .optional(),
});

// Text processing validation schemas
export const TextChunkingConfigSchema = z.object({
  chunkSize: z.number().min(100).max(4000).default(1500),
  chunkOverlap: z.number().min(0).max(1000).default(200),
  separators: z.array(z.string()).default(['\n\n', '\n', ' ', '']),
});

// Vector store validation schemas
export const EmbeddingConfigSchema = z.object({
  model: z.string().default('text-embedding-3-large'),
  dimensions: z.number().default(3072),
  batchSize: z.number().min(1).max(100).default(10),
});

export const VectorSearchConfigSchema = z.object({
  topK: z.number().min(1).max(50).default(5),
  threshold: z.number().min(0).max(1).optional(),
  includeMetadata: z.boolean().default(true),
  includeValues: z.boolean().default(false),
});

// Helper validation functions
export function validateFile(file: File): z.SafeParseReturnType<File, File> {
  return DocumentUploadSchema.shape.file.safeParse(file);
}

export function validateChatMessage(
  message: string,
  conversationId: string
): z.SafeParseReturnType<
  { content: string; conversationId: string },
  { content: string; conversationId: string }
> {
  return ChatMessageSchema.safeParse({
    content: message,
    conversationId,
  });
}

export function validateUUID(id: string): z.SafeParseReturnType<string, string> {
  return UUIDSchema.safeParse(id);
}

export function validateSearchQuery(
  query: string,
  limit?: number
): z.SafeParseReturnType<
  { query: string; limit?: number },
  { query: string; limit: number }
> {
  return SearchQuerySchema.safeParse({ query, limit });
}

// Type inference helpers
export type FileUploadInput = z.infer<typeof FileUploadSchema>;
export type ChatMessageInput = z.infer<typeof ChatMessageSchema>;
export type RetrievalToolInput = z.infer<typeof RetrievalToolInputSchema>;
export type EnvironmentConfig = z.infer<typeof EnvironmentConfigSchema>;
export type AppConfig = z.infer<typeof AppConfigSchema>;
export type SearchQuery = z.infer<typeof SearchQuerySchema>;
export type TextChunkingConfig = z.infer<typeof TextChunkingConfigSchema>;
export type EmbeddingConfig = z.infer<typeof EmbeddingConfigSchema>;
export type VectorSearchConfig = z.infer<typeof VectorSearchConfigSchema>;

// Error handling helper
export function formatValidationError(error: z.ZodError): string {
  return error.errors.map((err) => `${err.path.join('.')}: ${err.message}`).join(', ');
}

// Environment validation helper
export function validateEnvironmentVariables() {
  const env = {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    PINECONE_API_KEY: process.env.PINECONE_API_KEY,
    PINECONE_ENVIRONMENT: process.env.PINECONE_ENVIRONMENT,
    PINECONE_INDEX_NAME: process.env.PINECONE_INDEX_NAME,
    LANGCHAIN_TRACING_V2: process.env.LANGCHAIN_TRACING_V2,
    LANGCHAIN_API_KEY: process.env.LANGCHAIN_API_KEY,
    LANGCHAIN_PROJECT: process.env.LANGCHAIN_PROJECT,
    NEXT_PUBLIC_MAX_FILE_SIZE: process.env.NEXT_PUBLIC_MAX_FILE_SIZE || '10485760',
    NEXT_PUBLIC_ALLOWED_FILE_TYPES:
      process.env.NEXT_PUBLIC_ALLOWED_FILE_TYPES || 'application/pdf,text/plain',
  };

  const result = EnvironmentConfigSchema.safeParse(env);
  if (!result.success) {
    throw new Error(`Environment validation failed: ${formatValidationError(result.error)}`);
  }

  return result.data;
} 