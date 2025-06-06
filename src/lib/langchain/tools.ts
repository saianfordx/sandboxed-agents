import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { getPineconeClient } from '@/lib/pinecone/client';
import type { RetrievedDocument, RetrievalToolOutput } from '@/lib/utils/types';
import { RetrievalToolInputSchema } from '@/lib/utils/validation';
import OpenAI from 'openai';

/**
 * Tool for retrieving relevant documents from the vector store
 */
export const retrieveDocumentsTool = tool(
  async ({ query, numResults = 5, filter }: { 
    query: string; 
    numResults?: number; 
    filter?: Record<string, unknown> 
  }): Promise<RetrievalToolOutput> => {
    try {
      console.log(`Retrieving documents for query: "${query}" (limit: ${numResults})`);
      
      const pineconeClient = getPineconeClient();
      
      let documents: RetrievedDocument[];
      
      if (filter && Object.keys(filter).length > 0) {
        // Use filtered search if filters are provided
        documents = await pineconeClient.filteredSearch(query, filter, numResults);
      } else {
        // Use regular similarity search
        documents = await pineconeClient.similaritySearch(query, {
          topK: numResults,
          includeMetadata: true,
          includeValues: false,
        });
      }
      
      console.log(`Retrieved ${documents.length} documents`);
      
      return {
        documents,
        totalResults: documents.length,
        searchQuery: query,
      };
    } catch (error) {
      console.error('Document retrieval failed:', error);
      throw new Error(`Failed to retrieve documents: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
  {
    name: 'retrieve_documents',
    description: 'Retrieve relevant documents from the knowledge base using semantic search. Use this tool when you need to find information to answer user questions.',
    schema: RetrievalToolInputSchema,
  }
);

/**
 * Tool for searching documents by specific document title or source
 */
export const searchBySourceTool = tool(
  async ({ source, query, numResults = 5 }: { 
    source: string; 
    query: string; 
    numResults?: number 
  }) => {
    try {
      console.log(`Searching in source "${source}" for query: "${query}"`);
      
      const pineconeClient = getPineconeClient();
      
      // Use filtered search with source filter
      const documents = await pineconeClient.filteredSearch(
        query,
        {
          $or: [
            { source: { $eq: source } },
            { documentTitle: { $eq: source } },
          ],
        },
        numResults
      );
      
      console.log(`Found ${documents.length} documents in source "${source}"`);
      
      return {
        documents,
        totalResults: documents.length,
        searchQuery: query,
        source,
      };
    } catch (error) {
      console.error('Source-based search failed:', error);
      throw new Error(`Failed to search by source: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
  {
    name: 'search_by_source',
    description: 'Search for documents from a specific source or document title. Use this when the user asks about a specific document.',
    schema: z.object({
      source: z.string().describe('The document title or source to search within'),
      query: z.string().describe('The search query within the specified source'),
      numResults: z.number().min(1).max(20).default(5).describe('Number of results to return'),
    }),
  }
);

/**
 * Tool for getting information about available documents in the knowledge base
 */
export const getKnowledgeBaseInfoTool = tool(
  async () => {
    try {
      console.log('Getting knowledge base information...');
      
      const pineconeClient = getPineconeClient();
      const stats = await pineconeClient.getIndexStats();
      
      return {
        totalDocuments: stats.totalVectorCount,
        indexFullness: stats.indexFullness,
        dimensions: stats.dimension,
        indexName: pineconeClient.getIndexName(),
        message: `Knowledge base contains ${stats.totalVectorCount} document chunks with ${stats.dimension} dimensions. Index is ${(stats.indexFullness * 100).toFixed(2)}% full.`,
      };
    } catch (error) {
      console.error('Failed to get knowledge base info:', error);
      throw new Error(`Failed to get knowledge base information: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
  {
    name: 'get_knowledge_base_info',
    description: 'Get information about the knowledge base, including statistics and available documents.',
    schema: z.object({}),
  }
);

/**
 * Tool for contextualizing follow-up questions based on conversation history
 */
export const contextualizeQuestionTool = tool(
  async ({ question, conversationHistory }: { 
    question: string; 
    conversationHistory: string 
  }) => {
    try {
      // Simple contextualization logic
      // In a more advanced implementation, you might use an LLM for this
      
      const contextualizedQuestion = `${conversationHistory}\n\nBased on the above conversation, please answer: ${question}`;
      
      return {
        originalQuestion: question,
        contextualizedQuestion,
        hasContext: conversationHistory.length > 0,
      };
    } catch (error) {
      console.error('Question contextualization failed:', error);
      throw new Error(`Failed to contextualize question: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
  {
    name: 'contextualize_question',
    description: 'Reformulate a follow-up question to be standalone based on conversation history. Use this for follow-up questions that reference previous context.',
    schema: z.object({
      question: z.string().describe('The follow-up question to contextualize'),
      conversationHistory: z.string().describe('Recent conversation history for context'),
    }),
  }
);

/**
 * Tool for generating images using DALL-E
 */
export const generateImageTool = tool(
  async ({ prompt, size = "1024x1024", quality = "standard", style = "vivid" }: { 
    prompt: string; 
    size?: "256x256" | "512x512" | "1024x1024" | "1024x1792" | "1792x1024";
    quality?: "standard" | "hd";
    style?: "vivid" | "natural";
  }) => {
    try {
      console.log(`Generating image with prompt: "${prompt}"`);
      
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API key not configured');
      }

      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: size,
        quality: quality,
        style: style,
      });

      if (!response.data || response.data.length === 0) {
        throw new Error('No image data returned from DALL-E');
      }

      const firstImage = response.data[0];
      if (!firstImage) {
        throw new Error('No image data in response');
      }

      const imageUrl = firstImage.url;
      const revisedPrompt = firstImage.revised_prompt;
      
      if (!imageUrl) {
        throw new Error('No image URL returned from DALL-E');
      }

      console.log('Successfully generated image with DALL-E');
      
      return {
        imageUrl,
        originalPrompt: prompt,
        revisedPrompt,
        size,
        quality,
        style,
        message: `I've created an image based on your description: "${prompt}". ${revisedPrompt ? `DALL-E refined the prompt to: "${revisedPrompt}"` : ''}`,
      };
    } catch (error) {
      console.error('Image generation failed:', error);
      throw new Error(`Failed to generate image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
  {
    name: 'generate_image',
    description: 'Generate an image using DALL-E based on a text description. Use this tool when users ask to create, generate, draw, or make an image of something.',
    schema: z.object({
      prompt: z.string().describe('Detailed description of the image to generate'),
      size: z.enum(["256x256", "512x512", "1024x1024", "1024x1792", "1792x1024"]).default("1024x1024").describe('Size of the generated image'),
      quality: z.enum(["standard", "hd"]).default("standard").describe('Quality of the generated image'),
      style: z.enum(["vivid", "natural"]).default("vivid").describe('Style of the generated image - vivid for more hyper-real and dramatic, natural for more natural looking'),
    }),
  }
);

/**
 * Array of all available tools for the RAG system
 */
export const ragTools = [
  retrieveDocumentsTool,
  searchBySourceTool,
  getKnowledgeBaseInfoTool,
  contextualizeQuestionTool,
  generateImageTool,
];

/**
 * Get tools by name for dynamic tool selection
 */
export function getToolByName(name: string) {
  return ragTools.find(tool => tool.name === name);
}

/**
 * Get all tool names for reference
 */
export function getToolNames(): string[] {
  return ragTools.map(tool => tool.name);
}

/**
 * Validate tool input against schema
 */
export function validateToolInput(toolName: string, input: unknown): boolean {
  const tool = getToolByName(toolName);
  if (!tool) {
    return false;
  }
  
  try {
    tool.schema.parse(input);
    return true;
  } catch {
    return false;
  }
} 