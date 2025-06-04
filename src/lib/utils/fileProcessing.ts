import pdf from 'pdf-parse';
import { v4 as uuidv4 } from 'uuid';
import type { Document, DocumentMetadata, DocumentChunk, ChunkMetadata } from './types';
import { validateFile, type TextChunkingConfig } from './validation';

/**
 * Extract text content from a PDF file
 * @param file - PDF file to process
 * @returns Promise<string> - Extracted text content
 */
export async function extractPDFText(file: File): Promise<{
  text: string;
  pageCount: number;
}> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const data = await pdf(buffer);
    
    return {
      text: data.text,
      pageCount: data.numpages,
    };
  } catch (error) {
    throw new Error(`Failed to extract PDF text: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract text content from a TXT file
 * @param file - TXT file to process
 * @returns Promise<string> - File content as text
 */
export async function extractTXTText(file: File): Promise<{
  text: string;
  pageCount: number;
}> {
  try {
    const text = await file.text();
    
    // Estimate pages based on character count (assuming ~2000 chars per page)
    const estimatedPages = Math.max(1, Math.ceil(text.length / 2000));
    
    return {
      text,
      pageCount: estimatedPages,
    };
  } catch (error) {
    throw new Error(`Failed to extract TXT text: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Process uploaded file and extract text content
 * @param file - File to process (PDF or TXT)
 * @returns Promise<Document> - Processed document with metadata
 */
export async function processUploadedFile(file: File): Promise<Document> {
  // Validate file first
  const validation = validateFile(file);
  if (!validation.success) {
    throw new Error(`File validation failed: ${validation.error.errors[0]?.message}`);
  }

  const documentId = uuidv4();
  const uploadedAt = new Date();

  let extractedData: { text: string; pageCount: number };
  let mimeType = file.type;

  try {
    // Extract text based on file type
    if (file.type === 'application/pdf') {
      extractedData = await extractPDFText(file);
    } else if (file.type === 'text/plain') {
      extractedData = await extractTXTText(file);
    } else {
      throw new Error(`Unsupported file type: ${file.type}`);
    }

    // Create document metadata
    const metadata: DocumentMetadata = {
      originalName: file.name,
      mimeType,
      size: file.size,
      pageCount: extractedData.pageCount,
      source: file.name,
      language: detectLanguage(extractedData.text),
    };

    // Create document object
    const document: Document = {
      id: documentId,
      filename: file.name,
      content: extractedData.text,
      metadata,
      uploadedAt,
      status: 'processing',
    };

    return document;
  } catch (error) {
    throw new Error(`Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Simple language detection based on common patterns
 * @param text - Text to analyze
 * @returns string - Detected language code
 */
function detectLanguage(text: string): string {
  // Simple heuristic-based language detection
  const sample = text.substring(0, 1000).toLowerCase();
  
  // English indicators
  const englishIndicators = ['the', 'and', 'that', 'have', 'for', 'not', 'with', 'you', 'this', 'but'];
  const englishCount = englishIndicators.reduce((count, word) => {
    return count + (sample.split(word).length - 1);
  }, 0);
  
  // Spanish indicators
  const spanishIndicators = ['que', 'de', 'no', 'a', 'la', 'el', 'es', 'y', 'en', 'lo'];
  const spanishCount = spanishIndicators.reduce((count, word) => {
    return count + (sample.split(word).length - 1);
  }, 0);
  
  // French indicators
  const frenchIndicators = ['le', 'de', 'et', 'à', 'un', 'il', 'être', 'et', 'en', 'avoir'];
  const frenchCount = frenchIndicators.reduce((count, word) => {
    return count + (sample.split(word).length - 1);
  }, 0);
  
  if (englishCount > spanishCount && englishCount > frenchCount) {
    return 'en';
  } else if (spanishCount > frenchCount) {
    return 'es';
  } else if (frenchCount > 0) {
    return 'fr';
  }
  
  return 'unknown';
}

/**
 * Chunk document text into smaller pieces for embedding
 * @param document - Document to chunk
 * @param config - Chunking configuration
 * @returns DocumentChunk[] - Array of document chunks
 */
export function chunkDocument(
  document: Document,
  config: TextChunkingConfig = {
    chunkSize: 1500,
    chunkOverlap: 200,
    separators: ['\n\n', '\n', '. ', ' ', ''],
  }
): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  const text = document.content;
  const { chunkSize, chunkOverlap, separators } = config;
  
  if (text.length <= chunkSize) {
    // If text is smaller than chunk size, return as single chunk
    const chunk: DocumentChunk = {
      id: uuidv4(),
      documentId: document.id,
      content: text,
      metadata: createChunkMetadata(document, 0, text.length - 1, 0),
      index: 0,
    };
    chunks.push(chunk);
    return chunks;
  }
  
  let startIndex = 0;
  let chunkIndex = 0;
  
  while (startIndex < text.length) {
    let endIndex = Math.min(startIndex + chunkSize, text.length);
    
    // Try to find a good breaking point using separators
    if (endIndex < text.length) {
      let bestBreak = -1;
      
      for (const separator of separators) {
        const lastOccurrence = text.lastIndexOf(separator, endIndex);
        if (lastOccurrence > startIndex && lastOccurrence > bestBreak) {
          bestBreak = lastOccurrence + separator.length;
        }
      }
      
      if (bestBreak > startIndex) {
        endIndex = bestBreak;
      }
    }
    
    const chunkContent = text.substring(startIndex, endIndex).trim();
    
    if (chunkContent.length > 0) {
      const chunk: DocumentChunk = {
        id: uuidv4(),
        documentId: document.id,
        content: chunkContent,
        metadata: createChunkMetadata(document, startIndex, endIndex - 1, chunkIndex),
        index: chunkIndex,
      };
      chunks.push(chunk);
      chunkIndex++;
    }
    
    // Move start index for next chunk with overlap
    startIndex = endIndex - chunkOverlap;
    
    // Ensure we don't get stuck in infinite loop
    if (startIndex >= endIndex) {
      startIndex = endIndex;
    }
  }
  
  return chunks;
}

/**
 * Create chunk metadata
 * @param document - Source document
 * @param startChar - Start character index
 * @param endChar - End character index
 * @param chunkIndex - Index of the chunk
 * @returns ChunkMetadata
 */
function createChunkMetadata(
  document: Document,
  startChar: number,
  endChar: number,
  chunkIndex: number
): ChunkMetadata {
  // Estimate page number based on character position (rough approximation)
  const estimatedPageNumber = document.metadata.pageCount 
    ? Math.ceil((startChar / document.content.length) * document.metadata.pageCount)
    : undefined;
  
  return {
    startChar,
    endChar,
    pageNumber: estimatedPageNumber,
    source: document.metadata.source,
    documentTitle: document.filename,
  };
}

/**
 * Validate file type and size before processing
 * @param file - File to validate
 * @returns boolean - True if file is valid
 */
export function isValidFile(file: File): boolean {
  const validation = validateFile(file);
  return validation.success;
}

/**
 * Get file extension from filename
 * @param filename - Name of the file
 * @returns string - File extension (without dot)
 */
export function getFileExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.');
  return lastDotIndex !== -1 ? filename.substring(lastDotIndex + 1).toLowerCase() : '';
}

/**
 * Generate a safe filename for storage
 * @param originalName - Original filename
 * @returns string - Safe filename
 */
export function generateSafeFilename(originalName: string): string {
  const extension = getFileExtension(originalName);
  const nameWithoutExtension = originalName.substring(0, originalName.lastIndexOf('.'));
  const safeName = nameWithoutExtension
    .replace(/[^a-zA-Z0-9-_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  
  const timestamp = Date.now();
  return `${safeName}_${timestamp}${extension ? `.${extension}` : ''}`;
}

/**
 * Calculate estimated processing time based on file size
 * @param fileSize - Size of the file in bytes
 * @returns number - Estimated processing time in seconds
 */
export function estimateProcessingTime(fileSize: number): number {
  // Rough estimation: 1MB = ~5 seconds processing time
  const sizeInMB = fileSize / (1024 * 1024);
  return Math.ceil(sizeInMB * 5);
}

/**
 * Clean and normalize text content
 * @param text - Text to clean
 * @returns string - Cleaned text
 */
export function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')  // Normalize line endings
    .replace(/\r/g, '\n')    // Normalize line endings
    .replace(/\n{3,}/g, '\n\n')  // Reduce multiple newlines
    .replace(/\t/g, ' ')     // Replace tabs with spaces
    .replace(/[ ]{2,}/g, ' ') // Reduce multiple spaces
    .trim();
} 