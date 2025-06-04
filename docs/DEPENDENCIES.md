# PROJECT DEPENDENCIES

## REQUIRED PACKAGES FOR RAG APPLICATION

### Core LangChain Packages (v0.3+)
```bash
npm install @langchain/community @langchain/core
```
- **@langchain/community**: Community-maintained LangChain integrations and tools
- **@langchain/core**: Core LangChain functionality and base classes

### LangGraph for Conversation Management
```bash
npm install @langchain/langgraph
```
- **@langchain/langgraph**: Stateful conversation management and complex workflows
- **Required for**: Modern conversation memory, agent orchestration, and state management

### LangSmith Integration
```bash
npm install langsmith
```
- **langsmith**: LangChain monitoring, debugging, and observability platform
- **Note**: Automatically installed by LangChain but can be installed separately

### Vector Store & Embeddings
```bash
npm install @langchain/pinecone @pinecone-database/pinecone
npm install @langchain/openai
```
- **@langchain/pinecone**: Official LangChain Pinecone integration
- **@pinecone-database/pinecone**: Latest Pinecone SDK for vector store operations
- **@langchain/openai**: OpenAI API client for embeddings and language model operations

### Document Processing
```bash
npm install pdf-parse
```
- **pdf-parse**: PDF file parsing and text extraction

### Text Splitting
```bash
npm install @langchain/textsplitters
```
- **@langchain/textsplitters**: Advanced text splitting utilities for document chunking

### File Upload & Processing
```bash
npm install multer @types/multer
```
- **multer**: Handle multipart/form-data for file uploads
- **@types/multer**: TypeScript types for multer

### Environment & Configuration
```bash
npm install dotenv zod
```
- **dotenv**: Environment variable management
- **zod**: Runtime type validation and schema validation

### Utilities
```bash
npm install uuid @types/uuid
```
- **uuid**: Generate unique identifiers for documents and conversations
- **@types/uuid**: TypeScript types for uuid

## CURRENT PROJECT DEPENDENCIES

### Already Installed (from package.json)
- ✅ **next**: ^15.3.3
- ✅ **react**: ^19.0.0
- ✅ **react-dom**: ^19.0.0
- ✅ **typescript**: ^5
- ✅ **@types/node**: ^20
- ✅ **@types/react**: ^19
- ✅ **@types/react-dom**: ^19
- ✅ **tailwindcss**: ^4
- ✅ **eslint**: ^9
- ✅ **eslint-config-next**: 15.3.3

## INSTALLATION COMMANDS

### Core LangChain & AI Stack
```bash
# LangChain Core & Community
npm install @langchain/community @langchain/core

# LangGraph for conversation management
npm install @langchain/langgraph

# LangSmith for monitoring
npm install langsmith

# Vector Store & AI
npm install @langchain/pinecone @pinecone-database/pinecone @langchain/openai

# Text Processing
npm install @langchain/textsplitters pdf-parse
```

### Support Libraries
```bash
# File Upload & Validation
npm install multer @types/multer

# Utilities & Configuration
npm install dotenv zod uuid @types/uuid
```

### Single Command Installation
```bash
npm install @langchain/community @langchain/core @langchain/langgraph langsmith @langchain/pinecone @pinecone-database/pinecone @langchain/openai @langchain/textsplitters pdf-parse multer @types/multer dotenv zod uuid @types/uuid
```

## ENVIRONMENT VARIABLES REQUIRED

Create a `.env.local` file with:
```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Pinecone Configuration
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_ENVIRONMENT=your_pinecone_environment_here
PINECONE_INDEX_NAME=your_pinecone_index_name_here

# LangSmith Configuration (Optional but Recommended)
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=your_langsmith_api_key_here
LANGCHAIN_PROJECT=your_project_name_here

# Application Configuration
NEXT_PUBLIC_MAX_FILE_SIZE=10485760  # 10MB in bytes
NEXT_PUBLIC_ALLOWED_FILE_TYPES=application/pdf,text/plain
```

## PACKAGE VERSIONS & COMPATIBILITY

### Important Notes:
- **LangChain v0.3+**: Use modular approach with `@langchain/community` and `@langchain/core`
- **LangGraph**: Required for modern conversation memory and state management  
- **Pinecone**: Use latest `@langchain/pinecone` integration with `@pinecone-database/pinecone`
- **OpenAI**: Use `@langchain/openai` for embeddings (text-embedding-3-large recommended)
- **Next.js**: Compatible with App Router (v13+) and Server Actions

### Architecture Pattern:
```typescript
// Modern LangChain v0.3+ Pattern
import { ChatOpenAI } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";
import { StateGraph, MessagesAnnotation } from "@langchain/langgraph";
import { tool } from "@langchain/core/tools";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
```

### Documentation Links:
- [LangChain JS Documentation](https://js.langchain.com/docs/introduction)
- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/concepts/)
- [LangSmith Documentation](https://docs.smith.langchain.com/)
- [Pinecone Documentation](https://docs.pinecone.io/)
- [OpenAI API Documentation](https://platform.openai.com/docs/)

## DEPRECATED PACKAGES (DO NOT USE)
- ❌ `langchain` (monolithic package - use modular packages instead)
- ❌ `RunnableWithMessageHistory` (use LangGraph persistence instead)
- ❌ Legacy conversation memory classes (use LangGraph built-in persistence)

## PINECONE SETUP REQUIREMENTS

### Index Configuration:
- **Dimensions**: 3072 (for text-embedding-3-large)
- **Metric**: cosine
- **Cloud**: As per your preference (AWS, GCP, Azure)
- **Region**: Choose closest to your application

### Code Example:
```typescript
import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const index = pinecone.index(process.env.PINECONE_INDEX_NAME!);

const vectorStore = await PineconeStore.fromExistingIndex(
  new OpenAIEmbeddings({
    model: "text-embedding-3-large"
  }),
  {
    pineconeIndex: index,
    maxConcurrency: 5,
  }
);
```

---

**Last Updated**: Based on LangChain v0.3+ and latest Pinecone SDK 