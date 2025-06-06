'use server';

import { ChatOpenAI } from '@langchain/openai';
import { StateGraph, MessagesAnnotation } from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { BaseMessage, HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { ragTools } from '@/lib/langchain/tools';
import { validateChatMessage } from '@/lib/utils/validation';
import type { ChatCompletionRequest, ChatCompletionResponse } from '@/lib/utils/types';
import { v4 as uuidv4 } from 'uuid';

// Test mode - set to true to bypass external API calls
const TEST_MODE = !process.env.OPENAI_API_KEY || !process.env.PINECONE_API_KEY;

/**
 * Create the chat agent using LangGraph
 */
function createChatAgent() {
  // Initialize the language model
  const model = new ChatOpenAI({
    modelName: 'gpt-4',
    temperature: 0.7,
  });

  // Bind tools to the model
  const modelWithTools = model.bindTools(ragTools);

  // Define the agent function
  async function callModel(state: typeof MessagesAnnotation.State): Promise<Partial<typeof MessagesAnnotation.State>> {
    const messages = state.messages;
    
    // System message for RAG context
    const systemMessage = new SystemMessage(`You are a helpful AI assistant with access to a knowledge base and image generation capabilities. When users ask questions:

1. Use the retrieve_documents tool to find relevant information from the knowledge base
2. If you need information from a specific document, use the search_by_source tool  
3. Always cite your sources when providing information from retrieved documents
4. If no relevant information is found, say so clearly
5. Use the generate_image tool when users ask to create, generate, draw, or make an image
6. Be concise but comprehensive in your responses

Available tools:
- retrieve_documents: Search the knowledge base for relevant information
- search_by_source: Search within a specific document
- get_knowledge_base_info: Get statistics about available documents
- contextualize_question: Improve follow-up questions with conversation context
- generate_image: Create images using DALL-E based on text descriptions

Always strive to provide accurate, helpful responses based on the available knowledge.`);

    const allMessages = [systemMessage, ...messages];
    const response = await modelWithTools.invoke(allMessages);
    return { messages: [response] };
  }

  // Create the tool node
  const toolNode = new ToolNode(ragTools);

  // Define the conditional edge function
  function shouldContinue(state: typeof MessagesAnnotation.State): "tools" | "__end__" {
    const messages = state.messages;
    const lastMessage = messages[messages.length - 1];
    
    if (lastMessage && lastMessage.additional_kwargs && lastMessage.additional_kwargs.tool_calls) {
      return "tools";
    }
    return "__end__";
  }

  // Create the state graph
  const workflow = new StateGraph(MessagesAnnotation)
    .addNode("agent", callModel)
    .addNode("tools", toolNode)
    .addEdge("__start__", "agent")
    .addConditionalEdges("agent", shouldContinue)
    .addEdge("tools", "agent");

  return workflow.compile();
}

/**
 * Server action for chat completion
 * @param request - Chat completion request
 * @returns Promise<ChatCompletionResponse> - Chat response
 */
export async function chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
  try {
    console.log('Starting chat completion...', { 
      conversationId: request.conversationId,
      messageLength: request.message.length,
      testMode: TEST_MODE 
    });

    // Validate input
    const validation = validateChatMessage(request.message, request.conversationId);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors[0]?.message || 'Invalid input',
      };
    }

    const { message, conversationId, context } = request;

    if (TEST_MODE) {
      // In test mode, return a simple response
      console.log('TEST MODE: Returning simulated response');
      return {
        success: true,
        message: `TEST MODE: I received your message "${message}". Please set up your OpenAI and Pinecone API keys to enable full RAG functionality.`,
        messageId: `msg_${Date.now()}`,
        sources: [],
      };
    }

    // Create the chat agent
    const agent = createChatAgent();

    // Prepare messages for the agent
    const messages: BaseMessage[] = [];
    
    // Add context if provided (conversation history)
    if (context) {
      const contextMessages = context.split('\n').filter(line => line.trim());
      for (const contextLine of contextMessages) {
        if (contextLine.startsWith('user:')) {
          messages.push(new HumanMessage(contextLine.substring(5).trim()));
        } else if (contextLine.startsWith('assistant:')) {
          messages.push(new AIMessage(contextLine.substring(10).trim()));
        }
      }
    }
    
    // Add current user message
    messages.push(new HumanMessage(message));

    // Invoke the agent
    console.log('Invoking LangGraph agent...');
    const result = await agent.invoke({
      messages,
    });

    // Extract the final response
    const finalMessages = result.messages;
    console.log('Agent finished with', finalMessages.length, 'messages');
    
    // Find the last AI message and check for image generation
    let lastAIMessage: AIMessage | null = null;
    let imageUrl: string | undefined;
    let imageMetadata: any | undefined;
    
    for (let i = finalMessages.length - 1; i >= 0; i--) {
      const msg = finalMessages[i];
      if (msg instanceof AIMessage && typeof msg.content === 'string' && msg.content.trim()) {
        lastAIMessage = msg;
        break;
      }
    }
    
    // Check for tool results in messages to find image generation
    for (const msg of finalMessages) {
      if (msg.additional_kwargs?.tool_calls) {
        for (const toolCall of msg.additional_kwargs.tool_calls) {
          if (toolCall.function?.name === 'generate_image') {
            // Look for the corresponding tool message with results
            const toolMessageIndex = finalMessages.findIndex(m => 
              'tool_call_id' in m && m.tool_call_id === toolCall.id
            );
            if (toolMessageIndex !== -1) {
              try {
                const toolMessage = finalMessages[toolMessageIndex];
                const toolResult = JSON.parse(toolMessage.content as string);
                if (toolResult.imageUrl) {
                  imageUrl = toolResult.imageUrl;
                  imageMetadata = {
                    originalPrompt: toolResult.originalPrompt,
                    revisedPrompt: toolResult.revisedPrompt,
                    size: toolResult.size,
                    quality: toolResult.quality,
                    style: toolResult.style,
                  };
                }
              } catch (e) {
                console.log('Could not parse tool result for image generation');
              }
            }
          }
        }
      }
    }
    
    if (lastAIMessage) {
      console.log('Agent response generated successfully');
      
      return {
        success: true,
        message: lastAIMessage.content as string,
        messageId: `msg_${Date.now()}`,
        sources: [], // TODO: Extract sources from tool calls
        imageUrl,
        imageMetadata,
      };
    } else {
      console.error('No valid AI message found in response');
      return {
        success: false,
        message: 'Sorry, I could not generate a proper response.',
        error: 'No valid response from agent',
      };
    }

  } catch (error) {
    console.error('Chat completion failed:', error);
    
    return {
      success: false,
      message: 'Failed to generate response',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Server action to create a new conversation
 * @returns Promise<{ conversationId: string }> - New conversation ID
 */
export async function createConversation(): Promise<{ conversationId: string }> {
  const conversationId = uuidv4();
  
  console.log('Created new conversation:', conversationId);
  
  return { conversationId };
}

/**
 * Server action to get conversation history (placeholder for future implementation)
 * @param conversationId - ID of the conversation
 * @returns Promise<object> - Conversation history
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getConversationHistory(conversationId: string): Promise<{
  success: boolean;
  messages: any[];
  error?: string;
}> {
  // This is a placeholder for future implementation
  // In a real application, you might store conversation history in a database
  return {
    success: true,
    messages: [],
  };
} 