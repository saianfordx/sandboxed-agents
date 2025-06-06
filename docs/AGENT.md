# AI CHAT AGENT DOCUMENTATION

## SECTION 1: WHAT IS THIS DOING?

This file creates an **AI Chat Agent** that can have conversations with users while having access to a **knowledge base** (like a smart library). Think of it as a super-smart assistant that can:

1. **Answer questions** by searching through documents
2. **Remember conversations** to give better responses
3. **Find specific information** from uploaded files
4. **Cite sources** so you know where the information comes from

The agent uses several advanced technologies:
- **LangChain**: A framework for building AI applications
- **LangGraph**: Manages the conversation flow and decision-making
- **OpenAI GPT-4**: The brain that generates responses
- **Pinecone**: A database that stores and searches through documents

---

## SECTION 2: DETAILED CODE EXPLANATION

### 2.1 Import Dependencies

```typescript
import { ChatOpenAI } from '@langchain/openai';
import { StateGraph, MessagesAnnotation } from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { BaseMessage, HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { ragTools } from '@/lib/langchain/tools';
```

**What this does:** 
- Brings in all the necessary tools and components
- `ChatOpenAI`: Connects to OpenAI's GPT-4 model
- `StateGraph`: Creates a workflow for the AI agent
- Message types: Different kinds of messages (human, AI, system)
- `ragTools`: Custom tools for searching documents

### 2.2 Test Mode Configuration

```typescript
const TEST_MODE = !process.env.OPENAI_API_KEY || !process.env.PINECONE_API_KEY;
```

**What this does:**
- Checks if API keys are available
- If missing, runs in "test mode" with simulated responses
- Prevents crashes when APIs aren't configured

### 2.3 Creating the Chat Agent

```typescript
function createChatAgent() {
  const model = new ChatOpenAI({
    modelName: 'gpt-4',
    temperature: 0.7,
  });
```

**What this does:**
- Creates a connection to GPT-4
- `temperature: 0.7` makes responses creative but not too random
- Higher temperature = more creative, lower = more focused

### 2.4 System Instructions

```typescript
const systemMessage = new SystemMessage(`You are a helpful AI assistant with access to a knowledge base. When users ask questions:

1. Use the retrieve_documents tool to find relevant information from the knowledge base
2. If you need information from a specific document, use the search_by_source tool  
3. Always cite your sources when providing information from retrieved documents
4. If no relevant information is found, say so clearly
5. Be concise but comprehensive in your responses
```

**What this does:**
- Gives the AI its "personality" and instructions
- Tells it how to behave and what tools to use
- Like giving directions to a human assistant

### 2.5 Agent Decision Making

```typescript
function shouldContinue(state: typeof MessagesAnnotation.State): "tools" | "__end__" {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1];
  
  if (lastMessage && lastMessage.additional_kwargs && lastMessage.additional_kwargs.tool_calls) {
    return "tools";
  }
  return "__end__";
}
```

**What this does:**
- Decides what the agent should do next
- If the AI wants to use tools (search documents), it goes to "tools"
- If the AI has finished, it goes to "__end__"
- Like a traffic controller directing the conversation flow

### 2.6 Workflow Creation - Understanding LangGraph

```typescript
const workflow = new StateGraph(MessagesAnnotation)
  .addNode("agent", callModel)
  .addNode("tools", toolNode)
  .addEdge("__start__", "agent")
  .addConditionalEdges("agent", shouldContinue)
  .addEdge("tools", "agent");
```

**What this does:**
- Creates a flowchart for the conversation
- `agent` node: Where GPT-4 thinks and responds
- `tools` node: Where document searching happens
- Arrows show the path: Start → Agent → Tools (if needed) → Agent → End

#### 🔍 Deep Dive: Understanding LangGraph Workflows

**What is LangGraph?**
Think of LangGraph like a **traffic control system** for AI conversations. Just like how traffic lights and road signs control how cars move through a city, LangGraph controls how information flows through your AI system.

**Key Concepts Explained Simply:**

**1. Nodes (The Stations)**
- **Nodes** are like "stations" or "stops" in your workflow
- Each node does ONE specific job
- In our case:
  - `"agent"` node = The thinking station (where GPT-4 processes messages)
  - `"tools"` node = The research station (where document searching happens)

**2. Edges (The Roads)**
- **Edges** are like "roads" or "arrows" that connect the stations
- They tell the system: "After finishing this station, go to that station"
- Think of them as **directions** on a map

**3. Types of Edges:**

**Simple Edge (Always Go There):**
```typescript
.addEdge("__start__", "agent")
```
This means: "Always go from START to the AGENT station"

**Conditional Edge (Decision Point):**
```typescript
.addConditionalEdges("agent", shouldContinue)
```
This means: "After the AGENT station, check the `shouldContinue` function to decide where to go next"

#### 🗺️ Visual Workflow Diagram

```
    START
      ↓
   [AGENT]  ←─────────────┐
      ↓                   │
   Decision               │
   Point?                 │
      ↓                   │
   Need Tools?            │
   ↙        ↘             │
 YES         NO            │
  ↓           ↓            │
[TOOLS] ──────→ [END]      │
  ↓                       │
  └───────────────────────┘
```

**Step-by-Step Flow:**
1. **START** → **AGENT**: Always begins with the AI thinking
2. **AGENT** → **Decision**: AI decides if it needs to use tools
3. **Decision** → **TOOLS** (if needed): Search documents
4. **TOOLS** → **AGENT**: Return search results to AI
5. **AGENT** → **END**: AI gives final response

#### 🔧 How the Workflow Could Grow

**Current Simple Workflow:**
```
START → AGENT → TOOLS → AGENT → END
```

**Example: Adding More Tools**

```typescript
// More sophisticated workflow
const advancedWorkflow = new StateGraph(MessagesAnnotation)
  .addNode("agent", callModel)
  .addNode("document_search", documentSearchTool)
  .addNode("web_search", webSearchTool)
  .addNode("calculator", calculatorTool)
  .addNode("memory", conversationMemoryTool)
  .addNode("validator", responseValidator)
  
  // Starting point
  .addEdge("__start__", "agent")
  
  // Agent decides what tools to use
  .addConditionalEdges("agent", decideNextTool)
  
  // Different paths based on needs
  .addEdge("document_search", "agent")
  .addEdge("web_search", "agent") 
  .addEdge("calculator", "agent")
  .addEdge("memory", "agent")
  
  // Final validation before ending
  .addConditionalEdges("agent", needsValidation)
  .addEdge("validator", "__end__");
```

#### 🧠 How `decideNextTool` Makes Decisions

The `decideNextTool` function is like a **smart traffic controller** that looks at what the AI agent wants to do and sends it to the right tool. Here's how it works:

```typescript
function decideNextTool(state: typeof MessagesAnnotation.State): string {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1];
  
  // Check if the AI wants to use any tools
  if (!lastMessage.additional_kwargs?.tool_calls) {
    return "__end__"; // No tools needed, finish the conversation
  }
  
  // Get the first tool call the AI wants to make
  const toolCall = lastMessage.additional_kwargs.tool_calls[0];
  const toolName = toolCall.function.name;
  
  // Route to the appropriate tool based on what the AI requested
  switch (toolName) {
    case "retrieve_documents":
    case "search_by_source":
      return "document_search"; // Send to document search tool
      
    case "web_search":
    case "current_information":
      return "web_search"; // Send to web search tool
      
    case "calculate":
    case "math_operation":
      return "calculator"; // Send to calculator tool
      
    case "remember_conversation":
    case "get_chat_history":
      return "memory"; // Send to memory tool
      
    default:
      // If we don't recognize the tool, try document search as fallback
      console.log(`Unknown tool requested: ${toolName}, defaulting to document_search`);
      return "document_search";
  }
}
```

#### 🔍 Step-by-Step Decision Process

**1. Check if AI wants to use tools:**
```typescript
if (!lastMessage.additional_kwargs?.tool_calls) {
  return "__end__"; // AI is ready to give final answer
}
```

**2. Look at what specific tool the AI requested:**
```typescript
const toolName = toolCall.function.name;
// AI might request: "retrieve_documents", "web_search", "calculate", etc.
```

**3. Route to the correct node:**
```typescript
switch (toolName) {
  case "retrieve_documents": return "document_search";
  case "web_search": return "web_search";
  // ... and so on
}
```

#### 🎯 Real Examples of Decision Making

**Example 1: Document Question**
```
User: "What did our last quarterly report say about profits?"

AI thinks: "I need to search company documents"
AI requests: tool_calls = [{ function: { name: "retrieve_documents" } }]

decideNextTool sees: "retrieve_documents"
Decision: return "document_search"
Result: → Goes to document search tool
```

**Example 2: Current Information**
```
User: "What's the current stock price of Apple?"

AI thinks: "I need current web information"
AI requests: tool_calls = [{ function: { name: "web_search" } }]

decideNextTool sees: "web_search"  
Decision: return "web_search"
Result: → Goes to web search tool
```

**Example 3: Math Question**
```
User: "If we sold 1,234 units at $45.50 each, what's our revenue?"

AI thinks: "I need to calculate this"
AI requests: tool_calls = [{ function: { name: "calculate" } }]

decideNextTool sees: "calculate"
Decision: return "calculator"
Result: → Goes to calculator tool
```

**Example 4: No Tools Needed**
```
User: "Hello, how are you?"

AI thinks: "This is a simple greeting, no tools needed"
AI requests: No tool_calls (empty)

decideNextTool sees: No tool calls
Decision: return "__end__"
Result: → AI gives direct response and ends
```

#### 🔄 Advanced Decision Logic

You could make the decision function even smarter:

```typescript
function smartDecideNextTool(state: typeof MessagesAnnotation.State): string {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1];
  const userMessage = messages[messages.length - 2]; // The human's question
  
  if (!lastMessage.additional_kwargs?.tool_calls) {
    return "__end__";
  }
  
  const toolCall = lastMessage.additional_kwargs.tool_calls[0];
  const toolName = toolCall.function.name;
  const toolArgs = JSON.parse(toolCall.function.arguments);
  
  // Smart routing based on context and content
  if (toolName === "retrieve_documents") {
    // Check if it's about recent/current events
    if (userMessage.content.includes("current") || userMessage.content.includes("latest") || userMessage.content.includes("today")) {
      return "web_search"; // Use web search for current info
    }
    return "document_search"; // Use document search for stored info
  }
  
  if (toolName === "calculate") {
    // Check if we need data first
    if (toolArgs.needs_data) {
      return "document_search"; // Get data first, then calculate
    }
    return "calculator"; // Direct calculation
  }
  
  // Check conversation context for better routing
  const conversationContext = messages.slice(-5); // Last 5 messages
  const hasNumbers = conversationContext.some(msg => /\d+/.test(msg.content));
  
  if (hasNumbers && toolName === "analyze") {
    return "calculator"; // Numbers detected, likely needs calculation
  }
  
  // Default routing
  return basicToolRouting(toolName);
}
```

#### 🎛️ Multiple Tool Coordination

Sometimes the AI might need multiple tools in sequence:

```typescript
function coordinatedDecideNextTool(state: typeof MessagesAnnotation.State): string {
  const stateData = state.metadata || {};
  const toolsUsed = stateData.toolsUsed || [];
  const currentTask = stateData.currentTask;
  
  // Complex task: "Compare our sales to industry averages"
  if (currentTask === "sales_comparison") {
    if (!toolsUsed.includes("document_search")) {
      return "document_search"; // First: get our sales data
    }
    if (!toolsUsed.includes("web_search")) {
      return "web_search"; // Second: get industry data
    }
    if (!toolsUsed.includes("calculator")) {
      return "calculator"; // Third: calculate comparison
    }
    return "__end__"; // All tools used, ready to respond
  }
  
  // Single tool tasks
  return basicDecideNextTool(state);
}
```

#### 💡 Key Benefits of Smart Routing

**1. Efficiency**: Goes directly to the right tool
**2. Flexibility**: Can adapt based on context  
**3. Reliability**: Has fallbacks for unknown requests
**4. Extensibility**: Easy to add new tools and routing logic
**5. Intelligence**: Can coordinate multiple tools for complex tasks

This decision-making system makes the AI agent much more capable and intelligent in how it approaches different types of questions!

**Advanced Workflow Diagram:**
```
                    START
                      ↓
                   [AGENT]  ←─────────────────┐
                      ↓                       │
                  What do I need?              │
                 ┌─────┼─────┐                │
                 ↓     ↓     ↓                │
         [DOCUMENT] [WEB]  [CALC]             │
         [SEARCH]  [SEARCH] [ULATOR]          │
                 ↓     ↓     ↓                │
                 └─────┼─────┘                │
                       ↓                      │
                   [MEMORY]                   │
                       ↓                      │
                   [AGENT] ←──────────────────┘
                       ↓
                Need validation?
                   ↙       ↘
                 YES        NO
                  ↓          ↓
              [VALIDATOR]   [END]
                  ↓
                [END]
```

#### 🎯 Why This Architecture?

**1. Modularity**: Each tool is separate and reusable
- Want to add email sending? Just add an "email" node
- Want to remove web search? Just remove that node
- Easy to maintain and update

**2. Flexibility**: The AI decides what it needs
- Simple questions might not need any tools
- Complex questions might use multiple tools
- The same workflow handles both scenarios

**3. Reliability**: Built-in error handling
- If one tool fails, the system can continue
- Each step is logged and traceable
- Easy to debug when something goes wrong

**4. Scalability**: Easy to grow
- Start simple with just document search
- Add more tools as needed
- The framework handles the complexity

#### 🔄 Real-World Example Flow

**User asks: "What's the weather in Paris and how does it compare to our sales data from last month?"**

```
1. START → AGENT
   Agent thinks: "I need weather data AND sales data"

2. AGENT → WEATHER_TOOL
   Gets current weather in Paris

3. WEATHER_TOOL → AGENT
   Agent receives: "Paris: 15°C, cloudy"

4. AGENT → DOCUMENT_SEARCH
   Searches for sales data from last month

5. DOCUMENT_SEARCH → AGENT  
   Agent receives sales numbers

6. AGENT → CALCULATOR
   Compares weather patterns with sales trends

7. CALCULATOR → AGENT
   Agent gets correlation analysis

8. AGENT → END
   Provides complete answer combining both pieces of information
```

#### 🚦 The Decision Function Explained

```typescript
function shouldContinue(state): "tools" | "__end__" {
  const lastMessage = state.messages[state.messages.length - 1];
  
  // Check if AI wants to use tools
  if (lastMessage.additional_kwargs?.tool_calls) {
    return "tools";  // Go to tools station
  }
  return "__end__";  // Go to end station
}
```

**This function is like a traffic controller:**
- Looks at what the AI just said
- If AI says "I need to search for something" → Go to TOOLS
- If AI says "Here's my final answer" → Go to END

#### 💡 Benefits of This Approach

**For Developers:**
- Easy to add new capabilities
- Clear separation of concerns
- Excellent debugging and monitoring

**For Users:**
- More accurate responses (AI can gather multiple pieces of information)
- Transparent process (you can see what tools were used)
- Consistent experience across different types of questions

**For Business:**
- Scalable architecture
- Easy to integrate new data sources
- Maintainable and updatable system

This workflow design makes the AI system both powerful and manageable, like having a well-organized team where everyone knows their role and how to work together.

### 2.7 Main Chat Function

```typescript
export async function chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
```

**What this does:**
- This is the main function that handles user messages
- Takes a request (user message) and returns a response (AI message)
- `async` means it can wait for things like API calls

### 2.8 Input Validation

```typescript
const validation = validateChatMessage(request.message, request.conversationId);
if (!validation.success) {
  return {
    success: false,
    error: validation.error.errors[0]?.message || 'Invalid input',
  };
}
```

**What this does:**
- Checks if the user's message is valid
- Like a security guard checking if someone can enter
- Returns an error if something is wrong

### 2.9 Test Mode Response

```typescript
if (TEST_MODE) {
  console.log('TEST MODE: Returning simulated response');
  return {
    success: true,
    message: `TEST MODE: I received your message "${message}". Please set up your OpenAI and Pinecone API keys to enable full RAG functionality.`,
    messageId: `msg_${Date.now()}`,
    sources: [],
  };
}
```

**What this does:**
- If API keys are missing, gives a helpful test response
- Tells the user what they need to do to enable full functionality
- Prevents the app from crashing

### 2.10 Conversation Context Handling

```typescript
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
```

**What this does:**
- Loads previous conversation history
- Separates user messages from AI messages
- Helps the AI remember what was discussed before
- Like giving someone notes from a previous meeting

### 2.11 Agent Execution

```typescript
const result = await agent.invoke({
  messages,
});
```

**What this does:**
- Runs the entire AI agent workflow
- Passes all messages to the agent
- Waits for the complete response (including any document searches)

### 2.12 Response Extraction

```typescript
let lastAIMessage: AIMessage | null = null;
for (let i = finalMessages.length - 1; i >= 0; i--) {
  const msg = finalMessages[i];
  if (msg instanceof AIMessage && typeof msg.content === 'string' && msg.content.trim()) {
    lastAIMessage = msg;
    break;
  }
}
```

**What this does:**
- Finds the final AI response from all the messages
- Looks backwards through messages to find the last valid response
- Like finding the conclusion in a long conversation

### 2.13 Decide Next Tool

```typescript
function decideNextTool(state: typeof MessagesAnnotation.State): string {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1];
  
  // Check if the AI wants to use any tools
  if (!lastMessage.additional_kwargs?.tool_calls) {
    return "__end__"; // No tools needed, finish the conversation
  }
  
  // Get the first tool call the AI wants to make
  const toolCall = lastMessage.additional_kwargs.tool_calls[0];
  const toolName = toolCall.function.name;
  
  // Route to the appropriate tool based on what the AI requested
  switch (toolName) {
    case "retrieve_documents":
    case "search_by_source":
      return "document_search"; // Send to document search tool
      
    case "web_search":
    case "current_information":
      return "web_search"; // Send to web search tool
      
    case "calculate":
    case "math_operation":
      return "calculator"; // Send to calculator tool
      
    case "remember_conversation":
    case "get_chat_history":
      return "memory"; // Send to memory tool
      
    default:
      // If we don't recognize the tool, try document search as fallback
      console.log(`Unknown tool requested: ${toolName}, defaulting to document_search`);
      return "document_search";
  }
}
```

#### 🧠 How `decideNextTool` Makes Decisions

The `decideNextTool` function is like a **smart traffic controller** that looks at what the AI agent wants to do and sends it to the right tool. Here's how it works:

```typescript
function decideNextTool(state: typeof MessagesAnnotation.State): string {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1];
  
  // Check if the AI wants to use any tools
  if (!lastMessage.additional_kwargs?.tool_calls) {
    return "__end__"; // No tools needed, finish the conversation
  }
  
  // Get the first tool call the AI wants to make
  const toolCall = lastMessage.additional_kwargs.tool_calls[0];
  const toolName = toolCall.function.name;
  
  // Route to the appropriate tool based on what the AI requested
  switch (toolName) {
    case "retrieve_documents":
    case "search_by_source":
      return "document_search"; // Send to document search tool
      
    case "web_search":
    case "current_information":
      return "web_search"; // Send to web search tool
      
    case "calculate":
    case "math_operation":
      return "calculator"; // Send to calculator tool
      
    case "remember_conversation":
    case "get_chat_history":
      return "memory"; // Send to memory tool
      
    default:
      // If we don't recognize the tool, try document search as fallback
      console.log(`Unknown tool requested: ${toolName}, defaulting to document_search`);
      return "document_search";
  }
}
```

#### 🔍 Step-by-Step Decision Process

**1. Check if AI wants to use tools:**
```typescript
if (!lastMessage.additional_kwargs?.tool_calls) {
  return "__end__"; // AI is ready to give final answer
}
```

**2. Look at what specific tool the AI requested:**
```typescript
const toolName = toolCall.function.name;
// AI might request: "retrieve_documents", "web_search", "calculate", etc.
```

**3. Route to the correct node:**
```typescript
switch (toolName) {
  case "retrieve_documents": return "document_search";
  case "web_search": return "web_search";
  // ... and so on
}
```

#### 🎯 Real Examples of Decision Making

**Example 1: Document Question**
```
User: "What did our last quarterly report say about profits?"

AI thinks: "I need to search company documents"
AI requests: tool_calls = [{ function: { name: "retrieve_documents" } }]

decideNextTool sees: "retrieve_documents"
Decision: return "document_search"
Result: → Goes to document search tool
```

**Example 2: Current Information**
```
User: "What's the current stock price of Apple?"

AI thinks: "I need current web information"
AI requests: tool_calls = [{ function: { name: "web_search" } }]

decideNextTool sees: "web_search"  
Decision: return "web_search"
Result: → Goes to web search tool
```

**Example 3: Math Question**
```
User: "If we sold 1,234 units at $45.50 each, what's our revenue?"

AI thinks: "I need to calculate this"
AI requests: tool_calls = [{ function: { name: "calculate" } }]

decideNextTool sees: "calculate"
Decision: return "calculator"
Result: → Goes to calculator tool
```

**Example 4: No Tools Needed**
```
User: "Hello, how are you?"

AI thinks: "This is a simple greeting, no tools needed"
AI requests: No tool_calls (empty)

decideNextTool sees: No tool calls
Decision: return "__end__"
Result: → AI gives direct response and ends
```

#### 🔄 Advanced Decision Logic

You could make the decision function even smarter:

```typescript
function smartDecideNextTool(state: typeof MessagesAnnotation.State): string {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1];
  const userMessage = messages[messages.length - 2]; // The human's question
  
  if (!lastMessage.additional_kwargs?.tool_calls) {
    return "__end__";
  }
  
  const toolCall = lastMessage.additional_kwargs.tool_calls[0];
  const toolName = toolCall.function.name;
  const toolArgs = JSON.parse(toolCall.function.arguments);
  
  // Smart routing based on context and content
  if (toolName === "retrieve_documents") {
    // Check if it's about recent/current events
    if (userMessage.content.includes("current") || userMessage.content.includes("latest") || userMessage.content.includes("today")) {
      return "web_search"; // Use web search for current info
    }
    return "document_search"; // Use document search for stored info
  }
  
  if (toolName === "calculate") {
    // Check if we need data first
    if (toolArgs.needs_data) {
      return "document_search"; // Get data first, then calculate
    }
    return "calculator"; // Direct calculation
  }
  
  // Check conversation context for better routing
  const conversationContext = messages.slice(-5); // Last 5 messages
  const hasNumbers = conversationContext.some(msg => /\d+/.test(msg.content));
  
  if (hasNumbers && toolName === "analyze") {
    return "calculator"; // Numbers detected, likely needs calculation
  }
  
  // Default routing
  return basicToolRouting(toolName);
}
```

#### 🎛️ Multiple Tool Coordination

Sometimes the AI might need multiple tools in sequence:

```typescript
function coordinatedDecideNextTool(state: typeof MessagesAnnotation.State): string {
  const stateData = state.metadata || {};
  const toolsUsed = stateData.toolsUsed || [];
  const currentTask = stateData.currentTask;
  
  // Complex task: "Compare our sales to industry averages"
  if (currentTask === "sales_comparison") {
    if (!toolsUsed.includes("document_search")) {
      return "document_search"; // First: get our sales data
    }
    if (!toolsUsed.includes("web_search")) {
      return "web_search"; // Second: get industry data
    }
    if (!toolsUsed.includes("calculator")) {
      return "calculator"; // Third: calculate comparison
    }
    return "__end__"; // All tools used, ready to respond
  }
  
  // Single tool tasks
  return basicDecideNextTool(state);
}
```

#### 💡 Key Benefits of Smart Routing

**1. Efficiency**: Goes directly to the right tool
**2. Flexibility**: Can adapt based on context  
**3. Reliability**: Has fallbacks for unknown requests
**4. Extensibility**: Easy to add new tools and routing logic
**5. Intelligence**: Can coordinate multiple tools for complex tasks

This decision-making system makes the AI agent much more capable and intelligent in how it approaches different types of questions!

---

## SECTION 3: HOW TO USE IT

### 3.1 Basic Usage

To use this agent in your application:

```typescript
import { chatCompletion } from '@/actions/chatCompletion';

const response = await chatCompletion({
  message: "What is artificial intelligence?",
  conversationId: "conv_123",
  context: "" // Optional conversation history
});

if (response.success) {
  console.log("AI Response:", response.message);
} else {
  console.error("Error:", response.error);
}
```

### 3.2 Required Setup

Before using the agent, you need:

1. **Environment Variables:**
   ```env
   OPENAI_API_KEY=your_openai_key_here
   PINECONE_API_KEY=your_pinecone_key_here
   ```

2. **Pinecone Vector Database:** Set up with documents uploaded

3. **RAG Tools:** Implemented in `/lib/langchain/tools`

### 3.3 Request Format

```typescript
type ChatCompletionRequest = {
  message: string;           // User's question or message
  conversationId: string;    // Unique ID for this conversation
  context?: string;          // Optional conversation history
}
```

### 3.4 Response Format

```typescript
type ChatCompletionResponse = {
  success: boolean;          // Whether the request succeeded
  message: string;           // AI's response
  messageId?: string;        // Unique ID for this message
  sources?: string[];        // Documents used for the response
  error?: string;           // Error message if failed
}
```

### 3.5 Error Handling

The agent handles several types of errors:

- **Invalid Input**: Returns validation error
- **Missing API Keys**: Runs in test mode
- **API Failures**: Returns error message with details
- **No Response Generated**: Returns fallback error message

### 3.6 Conversation Management

```typescript
// Create a new conversation
const { conversationId } = await createConversation();

// Get conversation history (placeholder for future)
const history = await getConversationHistory(conversationId);
```

### 3.7 Integration with Frontend

In your React components:

```typescript
const [loading, setLoading] = useState(false);
const [messages, setMessages] = useState([]);

const sendMessage = async (userMessage: string) => {
  setLoading(true);
  
  const response = await chatCompletion({
    message: userMessage,
    conversationId: currentConversationId,
    context: buildContextFromMessages(messages)
  });
  
  if (response.success) {
    setMessages(prev => [...prev, 
      { type: 'user', content: userMessage },
      { type: 'assistant', content: response.message }
    ]);
  }
  
  setLoading(false);
};
```

---

## HOW EVERYTHING WORKS TOGETHER

### The Complete Flow:

1. **User sends a message** through the frontend
2. **Input validation** checks if the message is valid
3. **Test mode check** - if no API keys, return test response
4. **Agent creation** - sets up GPT-4 with tools and instructions
5. **Context loading** - adds conversation history if available
6. **Agent execution** - runs the complete workflow:
   - GPT-4 analyzes the message
   - Decides if it needs to search documents
   - Uses tools to find relevant information
   - Generates a response based on found information
7. **Response extraction** - gets the final AI message
8. **Return to user** - sends the response back to the frontend

### Key Benefits:

- **Smart Document Search**: Finds relevant information automatically
- **Conversation Memory**: Remembers context from previous messages
- **Source Citation**: Shows where information comes from
- **Error Resilience**: Handles failures gracefully
- **Test Mode**: Works even without API keys for development

### Performance Considerations:

- **Async Operations**: All API calls are non-blocking
- **Error Boundaries**: Comprehensive error handling prevents crashes
- **Logging**: Detailed console logs for debugging
- **Validation**: Input checking prevents invalid requests

This agent represents a sophisticated AI system that combines conversation, document retrieval, and intelligent response generation into a seamless user experience. 