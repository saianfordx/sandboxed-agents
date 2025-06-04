import { Pinecone } from '@pinecone-database/pinecone';
import { PineconeStore } from '@langchain/pinecone';
import { OpenAIEmbeddings } from '@langchain/openai';
import type { DocumentChunk, RetrievedDocument } from '../utils/types';
import { validateEnvironmentVariables, type VectorSearchConfig } from '../utils/validation';

/**
 * Pinecone client for vector store operations
 */
export class PineconeClient {
  private pinecone: Pinecone;
  private indexName: string;
  private embeddings: OpenAIEmbeddings;
  private vectorStore: PineconeStore | null = null;

  constructor() {
    // Validate environment variables
    const env = validateEnvironmentVariables();
    
    this.pinecone = new Pinecone({
      apiKey: env.PINECONE_API_KEY,
    });
    
    this.indexName = env.PINECONE_INDEX_NAME;
    
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: env.OPENAI_API_KEY,
      modelName: 'text-embedding-3-large',
      dimensions: 3072,
      stripNewLines: true,
    });
  }

  /**
   * Initialize the vector store connection
   * @returns Promise<PineconeStore> - Initialized vector store
   */
  async initializeVectorStore(): Promise<PineconeStore> {
    try {
      if (this.vectorStore) {
        return this.vectorStore;
      }

      console.log(`Connecting to Pinecone index: ${this.indexName}`);
      
      const index = this.pinecone.index(this.indexName);
      
      this.vectorStore = await PineconeStore.fromExistingIndex(this.embeddings, {
        pineconeIndex: index,
        maxConcurrency: 5, // Number of concurrent requests
        textKey: 'text',
        namespace: '', // Use default namespace
      });

      console.log('Successfully connected to Pinecone vector store');
      return this.vectorStore;
    } catch (error) {
      throw new Error(
        `Failed to initialize Pinecone vector store: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Store document chunks in Pinecone
   * @param chunks - Array of document chunks with embeddings
   * @returns Promise<string[]> - Array of stored document IDs
   */
  async storeDocumentChunks(chunks: DocumentChunk[]): Promise<string[]> {
    try {
      if (chunks.length === 0) {
        return [];
      }

      console.log(`Storing ${chunks.length} document chunks in Pinecone...`);

      const vectorStore = await this.initializeVectorStore();
      
      // Prepare documents for storage
      const documents = chunks.map(chunk => ({
        pageContent: chunk.content,
        metadata: {
          chunkId: chunk.id,
          documentId: chunk.documentId,
          index: chunk.index,
          startChar: chunk.metadata.startChar,
          endChar: chunk.metadata.endChar,
          pageNumber: chunk.metadata.pageNumber,
          source: chunk.metadata.source,
          documentTitle: chunk.metadata.documentTitle,
        },
      }));

      // Store in Pinecone using addDocuments
      const ids = await vectorStore.addDocuments(documents);
      
      console.log(`Successfully stored ${ids.length} chunks in Pinecone`);
      return ids;
    } catch (error) {
      throw new Error(
        `Failed to store document chunks: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Search for similar documents in Pinecone
   * @param query - Search query text
   * @param config - Search configuration
   * @returns Promise<RetrievedDocument[]> - Array of retrieved documents
   */
  async similaritySearch(
    query: string,
    config: VectorSearchConfig = {
      topK: 5,
      includeMetadata: true,
      includeValues: false,
    }
  ): Promise<RetrievedDocument[]> {
    try {
      if (!query.trim()) {
        throw new Error('Search query cannot be empty');
      }

      console.log(`Searching for similar documents with query: "${query}"`);

      const vectorStore = await this.initializeVectorStore();
      
      // Perform similarity search
      const results = await vectorStore.similaritySearchWithScore(query, config.topK, {
        // Add any filters here if needed
      });

      // Transform results to RetrievedDocument format
      const retrievedDocs: RetrievedDocument[] = results.map(([doc, score]) => ({
        content: doc.pageContent,
        metadata: {
          startChar: doc.metadata.startChar || 0,
          endChar: doc.metadata.endChar || 0,
          pageNumber: doc.metadata.pageNumber,
          source: doc.metadata.source || '',
          documentTitle: doc.metadata.documentTitle || '',
        },
        score: score,
        documentId: doc.metadata.documentId || '',
      }));

      console.log(`Found ${retrievedDocs.length} similar documents`);
      return retrievedDocs;
    } catch (error) {
      throw new Error(
        `Failed to perform similarity search: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Search with filtering by document metadata
   * @param query - Search query text
   * @param filter - Metadata filter
   * @param topK - Number of results to return
   * @returns Promise<RetrievedDocument[]> - Filtered search results
   */
  async filteredSearch(
    query: string,
    filter: Record<string, unknown>,
    topK: number = 5
  ): Promise<RetrievedDocument[]> {
    try {
      const vectorStore = await this.initializeVectorStore();
      
      // Perform filtered similarity search
      const results = await vectorStore.similaritySearchWithScore(query, topK, filter);

      return results.map(([doc, score]) => ({
        content: doc.pageContent,
        metadata: {
          startChar: doc.metadata.startChar || 0,
          endChar: doc.metadata.endChar || 0,
          pageNumber: doc.metadata.pageNumber,
          source: doc.metadata.source || '',
          documentTitle: doc.metadata.documentTitle || '',
        },
        score: score,
        documentId: doc.metadata.documentId || '',
      }));
    } catch (error) {
      throw new Error(
        `Failed to perform filtered search: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Delete document chunks from Pinecone by document ID
   * @param documentId - ID of the document to delete
   * @returns Promise<void>
   */
  async deleteDocumentChunks(documentId: string): Promise<void> {
    try {
      console.log(`Deleting chunks for document: ${documentId}`);

      const index = this.pinecone.index(this.indexName);
      
      // Delete all vectors with the specified document ID
      await index.deleteMany({
        filter: {
          documentId: { $eq: documentId },
        },
      });

      console.log(`Successfully deleted chunks for document: ${documentId}`);
    } catch (error) {
      throw new Error(
        `Failed to delete document chunks: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get index statistics
   * @returns Promise<object> - Index statistics
   */
  async getIndexStats(): Promise<{
    totalVectorCount: number;
    indexFullness: number;
    dimension: number;
  }> {
    try {
      const index = this.pinecone.index(this.indexName);
      const stats = await index.describeIndexStats();
      
      return {
        totalVectorCount: stats.totalRecordCount || 0,
        indexFullness: stats.indexFullness || 0,
        dimension: stats.dimension || 3072,
      };
    } catch (error) {
      throw new Error(
        `Failed to get index stats: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Test the connection to Pinecone
   * @returns Promise<boolean> - True if connection is successful
   */
  async testConnection(): Promise<boolean> {
    try {
      const stats = await this.getIndexStats();
      console.log('Pinecone connection test successful:', stats);
      return true;
    } catch (error) {
      console.error('Pinecone connection test failed:', error);
      return false;
    }
  }

  /**
   * List all indexes in the Pinecone project
   * @returns Promise<string[]> - Array of index names
   */
  async listIndexes(): Promise<string[]> {
    try {
      const indexes = await this.pinecone.listIndexes();
      return indexes.indexes?.map(index => index.name || '') || [];
    } catch (error) {
      throw new Error(
        `Failed to list indexes: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Check if the configured index exists
   * @returns Promise<boolean> - True if index exists
   */
  async indexExists(): Promise<boolean> {
    try {
      const indexes = await this.listIndexes();
      return indexes.includes(this.indexName);
    } catch (error) {
      console.error('Failed to check if index exists:', error);
      return false;
    }
  }

  /**
   * Get the configured index name
   * @returns string - Index name
   */
  getIndexName(): string {
    return this.indexName;
  }

  /**
   * Clear the vector store cache (useful for testing)
   */
  clearCache(): void {
    this.vectorStore = null;
  }
}

/**
 * Create a singleton instance of the Pinecone client
 */
let pineconeClientInstance: PineconeClient | null = null;

/**
 * Get or create the Pinecone client instance
 * @returns PineconeClient - Singleton instance
 */
export function getPineconeClient(): PineconeClient {
  if (!pineconeClientInstance) {
    pineconeClientInstance = new PineconeClient();
  }
  return pineconeClientInstance;
}

/**
 * Reset the singleton instance (useful for testing)
 */
export function resetPineconeClient(): void {
  pineconeClientInstance = null;
} 