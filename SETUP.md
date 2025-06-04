# RAG Knowledge Base Setup Guide

## Required Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Pinecone Configuration  
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_ENVIRONMENT=your_pinecone_environment_here
PINECONE_INDEX_NAME=your_pinecone_index_name_here

# LangSmith Configuration (optional, for debugging)
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=your_langsmith_api_key_here
LANGCHAIN_PROJECT=rag-knowledge-base

# File Upload Configuration
NEXT_PUBLIC_MAX_FILE_SIZE=10485760
NEXT_PUBLIC_ALLOWED_FILE_TYPES=application/pdf,text/plain
```

## Setup Steps

### 1. OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy and paste it as `OPENAI_API_KEY`

### 2. Pinecone Setup
1. Go to [Pinecone](https://www.pinecone.io/)
2. Sign up for a free account
3. Create a new index with:
   - **Dimensions**: 3072 (for OpenAI text-embedding-3-large)
   - **Metric**: cosine
   - **Environment**: Choose your region (e.g., us-east-1-aws)
4. Get your API key from the dashboard
5. Set the environment variables:
   - `PINECONE_API_KEY`: Your API key
   - `PINECONE_ENVIRONMENT`: Your environment (e.g., us-east-1-aws)  
   - `PINECONE_INDEX_NAME`: Your index name

### 3. LangSmith (Optional)
1. Go to [LangSmith](https://smith.langchain.com/)
2. Sign up for an account
3. Get your API key
4. Set `LANGCHAIN_API_KEY`

## Testing the Setup

After setting up the environment variables:

```bash
npm run dev
```

Then try uploading a text file first to test the basic flow.

## Troubleshooting

If you get errors about missing environment variables, make sure:
1. Your `.env.local` file is in the project root (same level as package.json)
2. All required variables are set
3. Restart the development server after adding the environment variables

## File Upload Flow

1. Upload validates file type and size
2. Server processes the file (extracts text)
3. Text is chunked into smaller pieces
4. Embeddings are generated using OpenAI
5. Chunks are stored in Pinecone vector database 