import { validateFile } from './validation';

// Note: PDF processing functions have been moved to fileProcessing.server.ts
// for server-only use to avoid client-side build errors with the 'fs' module

/**
 * Check if a file is valid for processing
 * @param file - File to validate
 * @returns boolean - Whether the file is valid
 */
export function isValidFile(file: File): boolean {
  const validation = validateFile(file);
  return validation.success;
}

/**
 * Get file extension from filename
 * @param filename - Name of the file
 * @returns string - File extension (with dot)
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot !== -1 ? filename.substring(lastDot) : '';
}

/**
 * Generate a safe filename for storage
 * @param originalName - Original filename
 * @returns string - Safe filename
 */
export function generateSafeFilename(originalName: string): string {
  const timestamp = Date.now();
  const extension = getFileExtension(originalName);
  const baseName = originalName.replace(extension, '').replace(/[^a-zA-Z0-9]/g, '_');
  return `${baseName}_${timestamp}${extension}`;
}

/**
 * Estimate processing time based on file size
 * @param fileSize - Size of file in bytes
 * @returns number - Estimated processing time in seconds
 */
export function estimateProcessingTime(fileSize: number): number {
  // Rough estimate: ~1MB per second for text extraction and processing
  const mbSize = fileSize / (1024 * 1024);
  return Math.max(2, Math.ceil(mbSize * 1.5));
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