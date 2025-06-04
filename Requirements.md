# RAG APPLICATION REQUIREMENTS

You are an expert project manager | team leader | software architect with vast knowledge on creating documentation for CURSOR AI.

## PROJECT OVERVIEW

We will create a **Next.js application** that implements a **RAG (Retrieval Augmented Generation)** system using:
- **Pinecone** vector store for document embeddings (using `@langchain/pinecone`)
- **LangChain v0.3+** conversational agents with modern tool-calling patterns
- **LangGraph** for stateful conversation management and memory persistence  
- **OpenAI API** for embeddings (`text-embedding-3-large`) and language model capabilities
- **Next.js Server Actions** as the backend implementation

## MODERN LANGCHAIN ARCHITECTURE

### LangChain v0.3+ Stack:
```bash
# Core LangChain packages (modular approach)
npm install @langchain/community @langchain/core

# LangGraph for conversation state management
npm install @langchain/langgraph

# LangSmith for monitoring and debugging
npm install langsmith

# Specific integrations
npm install @langchain/pinecone @langchain/openai @langchain/textsplitters
```

### Key Architectural Patterns:
- **Tool-calling RAG**: Implement retrieval as tools rather than simple similarity search
- **LangGraph State Management**: Use `MessagesAnnotation` and `StateGraph` for conversation memory
- **Modular Design**: Use specific LangChain packages rather than monolithic installation
- **Real-time Monitoring**: LangSmith integration for debugging and performance tracking

## CORE APIs TO IMPLEMENT

### 1. DOCUMENT PROCESSING & VECTOR STORE API

**Purpose**: Insert document chunks into Pinecone vector store for retrieval

**Input**: PDF files or TXT files (max 10MB each)

**Modern Implementation Process**:
- Accept file uploads using Next.js Server Actions
- Process documents with `pdf-parse` for PDFs, native Node.js for TXT
- **Chunk documents** using `RecursiveCharacterTextSplitter` from `@langchain/textsplitters`
  - Optimal chunk size: 1000-1500 characters
  - Overlap: 200-300 characters for context preservation
- **Generate embeddings** using `@langchain/openai` with `text-embedding-3-large` model
- **Store in Pinecone** using `PineconeStore.fromExistingIndex()` pattern
- Preserve document metadata throughout the pipeline

**Pinecone Configuration**:
```typescript
// Index specifications
Dimensions: 3072 (for text-embedding-3-large)
Metric: cosine
Environment: Your preferred cloud provider
```

**Expected Output**: 
- Document successfully chunked and embedded in Pinecone
- Metadata preserved for source attribution
- Proper error handling for failed uploads/processing

**Security & Validation**:
- File type validation (PDF/TXT only)
- File size limits (10MB maximum)
- Input sanitization and virus scanning
- Proper error handling for all edge cases

---

### 2. LANGCHAIN RAG CONVERSATIONAL AGENT

**Purpose**: Intelligent chat using retrieved context from Pinecone

**Modern RAG Implementation with Tool-Calling**:

**Input**: User message/question

**LangGraph Process Flow**:
1. **Message Processing**: Receive user input with proper validation
2. **Tool-based Retrieval**: Use LangChain tools to query Pinecone vector store
3. **Context Integration**: Inject retrieved documents into conversation context
4. **Response Generation**: Generate contextual response using OpenAI with retrieved information
5. **State Persistence**: Save conversation state using LangGraph's built-in memory
6. **Streaming Response**: Return response with real-time streaming

**Technical Implementation**:
```typescript
// Modern LangChain v0.3+ pattern
import { StateGraph, MessagesAnnotation } from "@langchain/langgraph";
import { tool } from "@langchain/core/tools";
import { PineconeStore } from "@langchain/pinecone";
import { ChatOpenAI } from "@langchain/openai";

// Tool-based retrieval instead of direct similarity search
const retrievalTool = tool({
  name: "retrieve_documents",
  description: "Retrieve relevant documents from knowledge base",
  schema: z.object({
    query: z.string().describe("Search query for document retrieval"),
    numResults: z.number().optional().default(5)
  }),
  func: async ({ query, numResults }) => {
    // Vector similarity search implementation
    const results = await vectorStore.similaritySearch(query, numResults);
    return results;
  }
});
```

**LangGraph Conversation State**:
- Use `MessagesAnnotation` for conversation history
- Implement conversation persistence with `MemorySaver`
- Handle long conversation summarization
- Maintain conversation threads with unique identifiers

**Output**: 
- Contextual response based on retrieved documents
- Source citations for transparency
- Conversation history maintained in both localStorage (frontend) and LangGraph (backend)
- Streaming responses for better user experience

**Technical Requirements**:
- Follow latest LangChain v0.3+ conversational agent documentation  
- Use specific LangChain packages: `@langchain/community`, `@langchain/core`, `@langchain/langgraph`
- Integrate LangSmith using `langsmith` package for monitoring and debugging
- Implement modern RAG patterns with tool-calling
- Store conversation history in localStorage (frontend) and LangGraph persistence (backend)
- Use streaming responses for better UX
- Implement proper memory management with conversation summarization

---

## FRONTEND REQUIREMENTS

### Modern UI Components:
- **File Upload Interface**: Drag-and-drop with progress indicators and validation
- **Chat Interface**: Real-time streaming responses with typing indicators
- **Source Citations**: Display retrieved document sources with each response
- **Conversation History**: Persistent chat history with search/filter capabilities
- **Error Handling**: User-friendly error messages and recovery options

### State Management:
- React state for UI interactions
- localStorage for conversation persistence
- Optimistic UI updates for better UX
- Proper loading states for all async operations

---

## PROJECT STRUCTURE

```
my-nextjs-app/
├── docs/
│   ├── RULES.md                    # Development rules and guidelines
│   ├── REQUIREMENTS_CHECKLIST.md  # Detailed task tracking
│   └── DEPENDENCIES.md             # Complete dependency list and installation guide
├── src/
│   ├── app/
│   │   ├── api/                    # Next.js API routes (if needed)
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx               # Main application page
│   ├── components/
│   │   ├── FileUpload.tsx         # Document upload component
│   │   ├── ChatInterface.tsx      # Main chat UI component
│   │   ├── MessageList.tsx        # Chat message display
│   │   └── ConversationHistory.tsx # Chat history management
│   ├── lib/
│   │   ├── langchain/
│   │   │   ├── agent.ts           # LangGraph conversation agent
│   │   │   ├── tools.ts           # Retrieval tools implementation
│   │   │   └── memory.ts          # Conversation memory management
│   │   ├── pinecone/
│   │   │   ├── client.ts          # Pinecone connection setup
│   │   │   └── operations.ts      # Vector store operations
│   │   ├── openai/
│   │   │   └── embeddings.ts      # OpenAI embeddings client
│   │   └── utils/
│   │       ├── fileProcessing.ts  # Document processing utilities
│   │       ├── validation.ts      # Input validation schemas
│   │       └── types.ts           # TypeScript type definitions
│   └── actions/
│       ├── uploadDocument.ts      # Server action for file upload
│       └── chatCompletion.ts      # Server action for chat functionality
├── .env.local                     # Environment variables (copy from .env.sample)
├── .env.sample                    # Environment variables template
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── next.config.js
```

## ENVIRONMENT VARIABLES

**IMPORTANT**: Copy `.env.sample` to `.env.local` and fill in your actual API keys:

```bash
cp .env.sample .env.local
```

The `.env.sample` file contains:
- OpenAI API configuration (text-embedding-3-large model)
- Pinecone vector database setup (3072 dimensions, cosine metric)
- LangSmith monitoring and debugging setup
- Application configuration (file size limits, allowed types)
- Detailed setup instructions for each service

## SUCCESS CRITERIA

1. ✅ **Real API Integration**: No mocked data or callbacks - everything uses real APIs
2. ✅ **Modern LangChain Patterns**: Uses v0.3+ with modular packages and tool-calling
3. ✅ **LangGraph Implementation**: Proper conversation state management and persistence
4. ✅ **Pinecone Integration**: Successfully stores and retrieves document embeddings
5. ✅ **Streaming Responses**: Real-time chat experience with streaming
6. ✅ **Source Attribution**: Clear citations for retrieved information
7. ✅ **Error Handling**: Comprehensive error handling for all failure scenarios
8. ✅ **TypeScript Safety**: Strict typing throughout the application
9. ✅ **Performance**: Optimized for responsive user experience
10. ✅ **Monitoring**: LangSmith integration for debugging and observability

## FORBIDDEN PRACTICES

❌ **NEVER:**
- Use mocked data or dummy responses in production code
- Use the monolithic `langchain` package (use modular packages)
- Use deprecated LangChain patterns like `RunnableWithMessageHistory`
- Skip error handling or input validation
- Assume API behavior without consulting latest documentation
- Use callbacks with fake information

✅ **ALWAYS:**
- Consult latest documentation before implementing
- Use real API calls and actual data
- Follow LangChain v0.3+ modular patterns
- Implement proper TypeScript typing
- Test with real documents and conversations
- Update documentation as features are completed

---

**Documentation Links:**
- [LangChain JS Documentation](https://js.langchain.com/docs/introduction)
- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/concepts/)
- [Pinecone Documentation](https://docs.pinecone.io/)
- [OpenAI API Documentation](https://platform.openai.com/docs/)

*Requirements based on LangChain v0.3+, LangGraph, and modern RAG implementation patterns*

## NEXT STEPS

1. **Review** `docs/RULES.md` for development guidelines
2. **Check** `docs/REQUIREMENTS_CHECKLIST.md` for detailed task list
3. **Setup Environment**: Copy `.env.sample` to `.env.local` and configure API keys
4. **Install** dependencies from `docs/DEPENDENCIES.md`
5. **Research** latest documentation for each technology
6. **Start** with the first uncompleted requirement
7. **Update** the checklist as tasks are completed

---

**Remember**: This is a real-world application with actual API integrations. No mocked data, no assumptions, always verify with the latest documentation.



