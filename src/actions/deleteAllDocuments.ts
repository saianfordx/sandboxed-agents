'use server';

import { getPineconeClient } from '@/lib/pinecone/client';

// Test mode - set to true to bypass external API calls
const TEST_MODE = !process.env.OPENAI_API_KEY || !process.env.PINECONE_API_KEY;

/**
 * Server action to delete all documents from the Pinecone index
 * @returns Promise<object> - Deletion result
 */
export async function deleteAllDocuments(): Promise<{
  success: boolean;
  message: string;
  error?: string;
}> {
  try {
    console.log('Starting to delete all documents from Pinecone index...');

    if (TEST_MODE) {
      console.log('TEST MODE: Simulating deletion of all documents');
      return {
        success: true,
        message: 'TEST MODE: All documents would be deleted. Set up API keys in .env.local to enable full functionality.',
      };
    }

    const pineconeClient = getPineconeClient();
    
    // Get the index stats first to see what we're working with
    const stats = await pineconeClient.getIndexStats();
    console.log(`Index contains ${stats.totalVectorCount} vectors before deletion`);

    // Delete all vectors from the index
    await pineconeClient.deleteAllDocuments();

    console.log('Successfully deleted all documents from Pinecone index');

    // Verify deletion
    const newStats = await pineconeClient.getIndexStats();
    console.log(`Index now contains ${newStats.totalVectorCount} vectors`);

    return {
      success: true,
      message: `Successfully deleted all documents from the knowledge base. Removed ${stats.totalVectorCount} document chunks.`,
    };

  } catch (error) {
    console.error('Delete all documents failed:', error);
    
    return {
      success: false,
      message: 'Failed to delete all documents',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
} 