import { v4 as uuidv4 } from 'uuid';
import type { Document, DocumentMetadata, DocumentChunk, ChunkMetadata } from './types';
import { validateFile, type TextChunkingConfig } from './validation';

// Remove the problematic static import and use dynamic import instead
// import pdf from 'pdf-parse';

// Debug the pdf-parse import
console.log('fileProcessing.server.ts loaded without pdf-parse import');

/**
 * Extract text content from a PDF file (SERVER-ONLY)
 * @param file - PDF file to process
 * @returns Promise<string> - Extracted text content
 */
export async function extractPDFText(file: File): Promise<{
  text: string;
  pageCount: number;
}> {
  try {
    console.log('=== PDF EXTRACTION DEBUG ===');
    console.log('File name:', file.name);
    console.log('File size:', file.size);
    console.log('File type:', file.type);
    
    // Validate that we have a proper file
    if (!file || file.size === 0) {
      throw new Error('Invalid or empty file provided');
    }
    
    // Check if file type is PDF
    if (file.type !== 'application/pdf') {
      throw new Error(`Expected PDF file, got: ${file.type}`);
    }
    
    console.log('Converting file to ArrayBuffer...');
    const arrayBuffer = await file.arrayBuffer();
    console.log('ArrayBuffer size:', arrayBuffer.byteLength);
    
    // Validate ArrayBuffer
    if (arrayBuffer.byteLength === 0) {
      throw new Error('Empty file buffer');
    }
    
    console.log('Converting ArrayBuffer to Buffer...');
    const buffer = Buffer.from(arrayBuffer);
    console.log('Buffer size:', buffer.length);
    
    // Check if buffer starts with PDF header
    const pdfHeader = buffer.subarray(0, 4).toString();
    console.log('PDF header:', pdfHeader);
    if (!pdfHeader.startsWith('%PDF')) {
      throw new Error(`Invalid PDF file - header is: ${pdfHeader}`);
    }
    
    console.log('Dynamically importing pdf-parse...');
    
    // Use dynamic import to avoid module loading issues
    const { default: pdf } = await import('pdf-parse');
    
    console.log('Calling pdf-parse with buffer...');
    
    // Try to call pdf-parse with explicit buffer parameter
    const data = await pdf(buffer, {
      // Explicitly specify we're using a buffer, not a file path
      max: 0, // Parse all pages
    });
    
    console.log('PDF parsing successful!');
    console.log('Text length:', data.text.length);
    console.log('Number of pages:', data.numpages);
    
    return {
      text: data.text,
      pageCount: data.numpages,
    };
  } catch (error) {
    console.error('=== PDF EXTRACTION ERROR ===');
    console.error('Error type:', typeof error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Full error object:', error);
    
    throw new Error(`Failed to extract PDF text: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract text content from a TXT file (SERVER-ONLY)
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
 * Process uploaded file and extract text content (SERVER-ONLY)
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
  const mimeType = file.type;

  try {
    console.log('=== FILE PROCESSING DEBUG ===');
    console.log('File name:', file.name);
    console.log('File size:', file.size);
    console.log('File type:', file.type);

    // Extract text based on file type
    if (file.type === 'application/pdf') {
      console.log('Processing PDF file...');
      extractedData = await extractPDFText(file);
    } else if (file.type === 'text/plain') {
      console.log('Processing TXT file...');
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

    console.log('Document processing successful!');
    console.log('Document ID:', document.id);
    console.log('Content length:', document.content.length);

    return document;
  } catch (error) {
    console.error('=== FILE PROCESSING ERROR ===');
    console.error('Error:', error);
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
 * Chunk document text into smaller pieces for embedding (SERVER-ONLY)
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
    
    // Move to next chunk with overlap
    startIndex = Math.max(startIndex + 1, endIndex - chunkOverlap);
    
    // Prevent infinite loop
    if (startIndex >= text.length) {
      break;
    }
  }
  
  return chunks;
}

/**
 * Create metadata for a document chunk
 * @param document - Source document
 * @param startChar - Starting character index
 * @param endChar - Ending character index
 * @param chunkIndex - Index of the chunk (unused but kept for API consistency)
 * @returns ChunkMetadata - Chunk metadata
 */
function createChunkMetadata(
  document: Document,
  startChar: number,
  endChar: number,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  chunkIndex: number
): ChunkMetadata {
  return {
    startChar,
    endChar,
    pageNumber: Math.floor(startChar / 2000) + 1, // Rough estimate
    source: document.metadata.source,
    documentTitle: document.filename,
  };
}

/**
 * Clean text by removing extra whitespace and normalizing characters
 * @param text - Text to clean
 * @returns string - Cleaned text
 */
export function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\r/g, '\n')   // Normalize line endings
    .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
    .replace(/[ \t]+/g, ' ') // Replace multiple spaces/tabs with single space
    .replace(/^\s+|\s+$/gm, '') // Trim each line
    .trim(); // Trim the entire text
} 