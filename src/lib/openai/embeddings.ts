import { OpenAIEmbeddings } from '@langchain/openai';
import type { DocumentChunk } from '../utils/types';
import { validateEnvironmentVariables, type EmbeddingConfig } from '../utils/validation';

/**
 * OpenAI Embeddings client with proper configuration
 */
export class EmbeddingsClient {
  private embeddings: OpenAIEmbeddings;
  private config: EmbeddingConfig;

  constructor(config?: Partial<EmbeddingConfig>) {
    // Validate environment variables
    const env = validateEnvironmentVariables();
    
    this.config = {
      model: 'text-embedding-3-large',
      dimensions: 3072,
      batchSize: 10,
      ...config,
    };

    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: env.OPENAI_API_KEY,
      modelName: this.config.model,
      dimensions: this.config.dimensions,
      stripNewLines: true,
    });
  }

  /**
   * Generate embeddings for a single text
   * @param text - Text to embed
   * @returns Promise<number[]> - Embedding vector
   */
  async embedText(text: string): Promise<number[]> {
    try {
      if (!text.trim()) {
        throw new Error('Text cannot be empty');
      }

      const embedding = await this.embeddings.embedQuery(text);
      return embedding;
    } catch (error) {
      throw new Error(
        `Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generate embeddings for multiple texts in batches
   * @param texts - Array of texts to embed
   * @returns Promise<number[][]> - Array of embedding vectors
   */
  async embedTexts(texts: string[]): Promise<number[][]> {
    try {
      if (texts.length === 0) {
        return [];
      }

      // Filter out empty texts
      const validTexts = texts.filter(text => text.trim().length > 0);
      
      if (validTexts.length === 0) {
        throw new Error('No valid texts to embed');
      }

      // Process in batches to avoid rate limits
      const embeddings: number[][] = [];
      const batchSize = this.config.batchSize;

      for (let i = 0; i < validTexts.length; i += batchSize) {
        const batch = validTexts.slice(i, i + batchSize);
        const batchEmbeddings = await this.embeddings.embedDocuments(batch);
        embeddings.push(...batchEmbeddings);
        
        // Add small delay between batches to respect rate limits
        if (i + batchSize < validTexts.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      return embeddings;
    } catch (error) {
      throw new Error(
        `Failed to generate embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generate embeddings for document chunks
   * @param chunks - Array of document chunks
   * @returns Promise<DocumentChunk[]> - Chunks with embeddings added
   */
  async embedDocumentChunks(chunks: DocumentChunk[]): Promise<DocumentChunk[]> {
    try {
      if (chunks.length === 0) {
        return [];
      }

      console.log(`Generating embeddings for ${chunks.length} chunks...`);
      
      // Extract texts from chunks
      const texts = chunks.map(chunk => chunk.content);
      
      // Generate embeddings
      const embeddings = await this.embedTexts(texts);
      
      // Add embeddings to chunks
      const chunksWithEmbeddings = chunks.map((chunk, index) => ({
        ...chunk,
        embedding: embeddings[index],
      }));

      console.log(`Successfully generated embeddings for ${chunksWithEmbeddings.length} chunks`);
      
      return chunksWithEmbeddings;
    } catch (error) {
      throw new Error(
        `Failed to embed document chunks: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Calculate similarity between two embeddings using cosine similarity
   * @param embedding1 - First embedding vector
   * @param embedding2 - Second embedding vector
   * @returns number - Similarity score between 0 and 1
   */
  calculateSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have the same dimensions');
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
    return magnitude > 0 ? dotProduct / magnitude : 0;
  }

  /**
   * Get the dimensions of the embedding model
   * @returns number - Number of dimensions in the embedding vector
   */
  getDimensions(): number {
    return this.config.dimensions;
  }

  /**
   * Get the model name being used
   * @returns string - Model name
   */
  getModelName(): string {
    return this.config.model;
  }

  /**
   * Validate that an embedding has the correct dimensions
   * @param embedding - Embedding vector to validate
   * @returns boolean - True if valid
   */
  validateEmbedding(embedding: number[]): boolean {
    return embedding.length === this.config.dimensions;
  }

  /**
   * Estimate cost for generating embeddings
   * @param textCount - Number of texts to embed
   * @param averageTokens - Average tokens per text (default: 100)
   * @returns object - Cost estimation
   */
  estimateCost(textCount: number, averageTokens: number = 100): {
    estimatedTokens: number;
    estimatedCostUSD: number;
  } {
    const totalTokens = textCount * averageTokens;
    
    // OpenAI text-embedding-3-large pricing (as of 2024)
    // $0.00013 per 1K tokens
    const costPer1KTokens = 0.00013;
    const estimatedCostUSD = (totalTokens / 1000) * costPer1KTokens;

    return {
      estimatedTokens: totalTokens,
      estimatedCostUSD: parseFloat(estimatedCostUSD.toFixed(6)),
    };
  }

  /**
   * Test the embeddings client connection
   * @returns Promise<boolean> - True if connection is successful
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.embedText('Test connection');
      return true;
    } catch (error) {
      console.error('Embeddings client test failed:', error);
      return false;
    }
  }
}

/**
 * Create a singleton instance of the embeddings client
 */
let embeddingsClientInstance: EmbeddingsClient | null = null;

/**
 * Get or create the embeddings client instance
 * @param config - Optional configuration
 * @returns EmbeddingsClient - Singleton instance
 */
export function getEmbeddingsClient(config?: Partial<EmbeddingConfig>): EmbeddingsClient {
  if (!embeddingsClientInstance) {
    embeddingsClientInstance = new EmbeddingsClient(config);
  }
  return embeddingsClientInstance;
}

/**
 * Reset the singleton instance (useful for testing)
 */
export function resetEmbeddingsClient(): void {
  embeddingsClientInstance = null;
} 