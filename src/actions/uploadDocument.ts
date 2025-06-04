'use server';

import { processUploadedFile, chunkDocument } from '@/lib/utils/fileProcessing';
import { getEmbeddingsClient } from '@/lib/openai/embeddings';
import { getPineconeClient } from '@/lib/pinecone/client';
import { validateFile } from '@/lib/utils/validation';
import type { UploadDocumentResponse } from '@/lib/utils/types';

/**
 * Server action to upload and process documents
 * @param formData - FormData containing the file
 * @returns Promise<UploadDocumentResponse> - Upload result
 */
export async function uploadDocument(formData: FormData): Promise<UploadDocumentResponse> {
  try {
    console.log('Starting document upload process...');

    // Extract file from FormData
    const file = formData.get('file') as File;
    
    if (!file) {
      return {
        success: false,
        message: 'No file provided',
        error: 'FILE_MISSING',
      };
    }

    console.log(`Processing file: ${file.name} (${file.size} bytes, ${file.type})`);

    // Validate file
    const validation = validateFile(file);
    if (!validation.success) {
      return {
        success: false,
        message: 'File validation failed',
        error: validation.error.errors[0]?.message || 'Invalid file',
      };
    }

    // Process the uploaded file
    console.log('Extracting text content from file...');
    const document = await processUploadedFile(file);
    
    console.log(`Extracted ${document.content.length} characters from ${document.filename}`);

    // Chunk the document
    console.log('Chunking document...');
    const chunks = chunkDocument(document, {
      chunkSize: 1500,
      chunkOverlap: 200,
      separators: ['\n\n', '\n', '. ', ' ', ''],
    });

    console.log(`Created ${chunks.length} chunks from document`);

    // Generate embeddings for chunks
    console.log('Generating embeddings...');
    const embeddingsClient = getEmbeddingsClient();
    const chunksWithEmbeddings = await embeddingsClient.embedDocumentChunks(chunks);

    console.log(`Generated embeddings for ${chunksWithEmbeddings.length} chunks`);

    // Store chunks in Pinecone
    console.log('Storing chunks in Pinecone...');
    const pineconeClient = getPineconeClient();
    const storedIds = await pineconeClient.storeDocumentChunks(chunksWithEmbeddings);

    console.log(`Successfully stored ${storedIds.length} chunks in Pinecone`);

    // Update document metadata
    document.metadata.chunkCount = chunks.length;
    document.status = 'completed';
    document.processedAt = new Date();

    return {
      success: true,
      documentId: document.id,
      message: `Successfully processed ${document.filename}. Created ${chunks.length} chunks and stored in vector database.`,
    };

  } catch (error) {
    console.error('Document upload failed:', error);
    
    return {
      success: false,
      message: 'Failed to process document',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Server action to get upload progress (placeholder for future implementation)
 * @param documentId - ID of the document being processed
 * @returns Promise<object> - Upload progress information
 */
export async function getUploadProgress(documentId: string): Promise<{
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  progress: number;
  message: string;
}> {
  // This is a placeholder for future implementation
  // In a real application, you might store progress in a database or cache
  return {
    status: 'completed',
    progress: 100,
    message: 'Document processing completed',
  };
}

/**
 * Server action to delete a document and its chunks from Pinecone
 * @param documentId - ID of the document to delete
 * @returns Promise<object> - Deletion result
 */
export async function deleteDocument(documentId: string): Promise<{
  success: boolean;
  message: string;
  error?: string;
}> {
  try {
    console.log(`Deleting document: ${documentId}`);

    const pineconeClient = getPineconeClient();
    await pineconeClient.deleteDocumentChunks(documentId);

    console.log(`Successfully deleted document: ${documentId}`);

    return {
      success: true,
      message: 'Document deleted successfully',
    };

  } catch (error) {
    console.error('Document deletion failed:', error);
    
    return {
      success: false,
      message: 'Failed to delete document',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Server action to test connections to external services
 * @returns Promise<object> - Connection test results
 */
export async function testConnections(): Promise<{
  openai: boolean;
  pinecone: boolean;
  errors: string[];
}> {
  const errors: string[] = [];
  let openaiStatus = false;
  let pineconeStatus = false;

  try {
    console.log('Testing OpenAI connection...');
    const embeddingsClient = getEmbeddingsClient();
    openaiStatus = await embeddingsClient.testConnection();
    if (!openaiStatus) {
      errors.push('OpenAI connection failed');
    }
  } catch (error) {
    errors.push(`OpenAI error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  try {
    console.log('Testing Pinecone connection...');
    const pineconeClient = getPineconeClient();
    pineconeStatus = await pineconeClient.testConnection();
    if (!pineconeStatus) {
      errors.push('Pinecone connection failed');
    }
  } catch (error) {
    errors.push(`Pinecone error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return {
    openai: openaiStatus,
    pinecone: pineconeStatus,
    errors,
  };
} 