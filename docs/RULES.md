# CURSOR AI DEVELOPMENT RULES

## PROJECT OVERVIEW
This is a Next.js application that implements a RAG (Retrieval Augmented Generation) system using Pinecone vector store and LangChain conversational agents, with integrated DALL-E image generation capabilities.

## CORE PRINCIPLES

### 1. DOCUMENTATION FIRST
- **ALWAYS** consult the LATEST official documentation before implementing any feature
- **ALWAYS** check [LangChain JS Documentation](https://js.langchain.com/docs/introduction)
- **ALWAYS** verify with [Pinecone Documentation](https://docs.pinecone.io/)
- **ALWAYS** check [OpenAI API Documentation](https://platform.openai.com/docs/)
- **ALWAYS** review [DALL-E API Documentation](https://platform.openai.com/docs/guides/images) for image generation
- **ALWAYS** review [Next.js Documentation](https://nextjs.org/docs) for App Router patterns
- **NEVER** assume implementation details - verify with current docs
- **NEVER** use outdated or deprecated methods

### 2. NO MOCKED DATA
- **NEVER EVER** use callbacks with mocked information
- **ALWAYS** use real API calls and actual data
- **NEVER** create placeholder or dummy data in production code
- **ALWAYS** implement proper error handling for real API responses

### 3. CODE QUALITY STANDARDS
- **ALWAYS** use TypeScript with strict typing
- **ALWAYS** follow clean code principles
- **ALWAYS** implement clean architecture patterns
- **ALWAYS** write self-documenting, easy-to-understand code
- **ALWAYS** handle errors gracefully with proper error messages

### 4. REQUIREMENTS TRACKING
- **ALWAYS** check `docs/REQUIREMENTS_CHECKLIST.md` before starting any work
- **ALWAYS** update the requirements status after completing tasks
- **NEVER** skip requirements or implement features not in the list
- **ALWAYS** follow the exact specifications in the requirements

### 5. LANGCHAIN IMPLEMENTATION (v0.3+)
- **ALWAYS** use the modular LangChain approach with separate packages
- **ALWAYS** install: `@langchain/community` and `@langchain/core`
- **ALWAYS** use LangSmith: `langsmith` package for monitoring and debugging
- **ALWAYS** implement proper LCEL (LangChain Expression Language) patterns
- **ALWAYS** use the latest conversational agent patterns
- **ALWAYS** implement proper memory management with LangGraph
- **ALWAYS** handle LangChain API errors gracefully
- **ALWAYS** use tool-calling capabilities for retrieval interactions
- **NEVER** use deprecated patterns like `RunnableWithMessageHistory` for new applications

### 6. PINECONE VECTOR STORE IMPLEMENTATION
- **ALWAYS** use `@langchain/pinecone` integration package
- **ALWAYS** use the latest Pinecone SDK: `@pinecone-database/pinecone`
- **ALWAYS** implement proper chunking strategies for documents
- **ALWAYS** use OpenAI embeddings: `text-embedding-3-large` or newer
- **ALWAYS** implement proper metadata indexing
- **ALWAYS** handle vector store connection errors
- **ALWAYS** configure appropriate index dimensions and metrics
- **ALWAYS** implement proper batch processing for embeddings

### 7. DOCUMENT PROCESSING
- **ALWAYS** use `pdf-parse` for PDF document processing
- **ALWAYS** implement proper file upload validation and security
- **ALWAYS** use `RecursiveCharacterTextSplitter` for optimal chunking
- **ALWAYS** configure appropriate chunk sizes (1000-1500 characters recommended)
- **ALWAYS** implement overlapping chunks (200-300 characters overlap)
- **ALWAYS** preserve document metadata through the processing pipeline

### 8. RAG IMPLEMENTATION PATTERNS
- **ALWAYS** implement retrieval as tools using LangChain's tool system
- **ALWAYS** use LangGraph for orchestrating retrieval and generation steps
- **ALWAYS** implement conversation history using LangGraph's built-in persistence
- **ALWAYS** use `MessagesAnnotation` for state management
- **ALWAYS** implement proper query contextualization for follow-up questions
- **ALWAYS** use streaming responses for better UX
- **ALWAYS** implement proper citation and source tracking

### 9. NEXT.JS SERVER ACTIONS
- **ALWAYS** use Next.js server actions for backend functionality
- **ALWAYS** implement proper authentication and authorization
- **ALWAYS** validate all inputs and sanitize data
- **ALWAYS** implement proper rate limiting and error handling
- **ALWAYS** use environment variables for sensitive configuration
- **ALWAYS** handle file uploads securely

### 10. FRONTEND IMPLEMENTATION
- **ALWAYS** use modern React patterns with hooks
- **ALWAYS** implement proper state management
- **ALWAYS** use localStorage for conversation persistence
- **ALWAYS** implement proper loading states and error handling
- **ALWAYS** create responsive and accessible UI components
- **ALWAYS** implement proper file upload UI with drag-and-drop

### 11. ENVIRONMENT CONFIGURATION
- **ALWAYS** use proper environment variable management:
  ```env
  OPENAI_API_KEY=your_openai_api_key
  PINECONE_API_KEY=your_pinecone_api_key
  PINECONE_ENVIRONMENT=your_pinecone_environment
  PINECONE_INDEX_NAME=your_pinecone_index_name
  LANGCHAIN_TRACING_V2=true
  LANGCHAIN_API_KEY=your_langsmith_api_key
  LANGCHAIN_PROJECT=your_project_name
  ```

### 12. TESTING AND VALIDATION
- **ALWAYS** test with real API endpoints
- **ALWAYS** validate all user inputs
- **ALWAYS** implement proper error boundaries
- **ALWAYS** test file upload functionality with real files
- **ALWAYS** validate vector store operations
- **ALWAYS** test conversation flows end-to-end

### 13. SECURITY PRACTICES
- **ALWAYS** validate and sanitize all file uploads
- **ALWAYS** implement proper CORS policies
- **ALWAYS** use secure environment variable handling
- **ALWAYS** implement proper input validation
- **ALWAYS** handle sensitive data appropriately
- **ALWAYS** implement rate limiting to prevent abuse

## DEVELOPMENT WORKFLOW

1. **BEFORE STARTING ANY TASK:**
   - Check this RULES.md file
   - Review `docs/REQUIREMENTS_CHECKLIST.md`
   - Consult latest documentation for relevant technologies
   - Verify all dependencies are correctly installed

2. **DURING DEVELOPMENT:**
   - Follow TypeScript strict mode
   - Implement proper error handling
   - Write clean, self-documenting code
   - Test with real data and APIs
   - Update progress in requirements checklist

3. **AFTER COMPLETING A TASK:**
   - Update the requirements list status to ✅ **DONE**
   - Verify implementation against documentation
   - Test the complete functionality end-to-end
   - Document any challenges or learnings

## FORBIDDEN PRACTICES
- ❌ Using mocked or dummy data in production code
- ❌ Assuming API behavior without checking documentation
- ❌ Implementing features not in the requirements list
- ❌ Using deprecated or outdated methods
- ❌ Skipping error handling
- ❌ Writing code without proper TypeScript types
- ❌ Implementing callbacks with fake responses
- ❌ Using legacy LangChain patterns when modern alternatives exist

## REQUIRED PRACTICES
- ✅ Always check latest documentation (LangChain v0.3+, Pinecone latest, OpenAI latest)
- ✅ Use real API calls and data
- ✅ Implement proper error handling
- ✅ Follow TypeScript strict typing
- ✅ Update requirements list status
- ✅ Write clean, maintainable code
- ✅ Test with real data and scenarios
- ✅ Use LangSmith for monitoring and debugging
- ✅ Implement proper conversation memory with LangGraph
- ✅ Use tool-calling patterns for retrieval interactions 