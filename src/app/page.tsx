import FileUpload from '@/components/FileUpload';

export default function Home() {
  const handleFileUpload = async (file: File) => {
    console.log('File uploaded successfully:', file.name);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            RAG Knowledge Base
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Upload your documents to create an intelligent knowledge base. 
            Ask questions and get answers powered by AI and vector search.
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
            Upload Documents
          </h2>
          <FileUpload
            onUpload={handleFileUpload}
            maxSize={10485760} // 10MB
            acceptedTypes={['application/pdf', 'text/plain']}
          />
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Document Processing</h3>
            <p className="text-gray-600 text-sm">
              Automatically extract text from PDFs and TXT files, chunk them optimally, and generate embeddings.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Vector Search</h3>
            <p className="text-gray-600 text-sm">
              Powered by Pinecone vector database with OpenAI embeddings for semantic search and retrieval.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">AI Chat</h3>
            <p className="text-gray-600 text-sm">
              Ask questions about your documents and get intelligent answers with source citations.
            </p>
          </div>
        </div>

        {/* Technology Stack */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
            Technology Stack
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4">
              <div className="text-2xl font-bold text-blue-600 mb-2">Next.js</div>
              <div className="text-sm text-gray-600">React Framework</div>
            </div>
            <div className="p-4">
              <div className="text-2xl font-bold text-green-600 mb-2">LangChain</div>
              <div className="text-sm text-gray-600">AI Framework</div>
            </div>
            <div className="p-4">
              <div className="text-2xl font-bold text-purple-600 mb-2">Pinecone</div>
              <div className="text-sm text-gray-600">Vector Database</div>
            </div>
            <div className="p-4">
              <div className="text-2xl font-bold text-orange-600 mb-2">OpenAI</div>
              <div className="text-sm text-gray-600">Embeddings & LLM</div>
            </div>
          </div>
        </div>

        {/* Status Section */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Ready to upload documents and start building your knowledge base
          </p>
        </div>
      </div>
    </main>
  );
}
