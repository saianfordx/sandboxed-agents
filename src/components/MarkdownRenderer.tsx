'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { RetrievedDocument } from '@/lib/utils/types';
import SourceModal, { SourceReference } from './SourceModal';

interface MarkdownRendererProps {
  content: string;
  sources?: RetrievedDocument[];
}

export default function MarkdownRenderer({ content, sources }: MarkdownRendererProps) {
  const [selectedSource, setSelectedSource] = useState<SourceReference | null>(null);
  const [showSourceModal, setShowSourceModal] = useState(false);

  // Function to extract source references from markdown-style citations
  const extractSourceReference = (href: string, text: string): SourceReference | null => {
    // Handle various citation formats - including sandbox: links and any link that looks like a citation
    const isCitation = href.startsWith('sandbox:') || 
                      href.includes('evergreen') || 
                      text.includes('^') || 
                      text.includes('LOOT BOX') ||
                      href.includes('#') ||
                      text.match(/\.(txt|pdf|doc|docx)$/i);
    
    if (isCitation) {
      // Extract document info from the text and href
      const filename = text.replace(/\[|\]|\^/g, '').trim(); // Clean up the text
      console.log('Looking for source:', filename, 'in sources:', sources);
      
      // More flexible matching logic
      const matchingSource = sources?.find(source => {
        const sourceFile = source.metadata.source || source.metadata.documentTitle || '';
        const sourceTitle = source.metadata.documentTitle || source.metadata.source || '';
        
        // Try multiple matching strategies
        return (
          sourceFile.toLowerCase().includes(filename.toLowerCase()) ||
          sourceTitle.toLowerCase().includes(filename.toLowerCase()) ||
          filename.toLowerCase().includes(sourceFile.toLowerCase()) ||
          filename.toLowerCase().includes(sourceTitle.toLowerCase()) ||
          // Also try exact matches
          sourceFile === filename ||
          sourceTitle === filename ||
          // Try without extensions
          sourceFile.replace(/\.[^/.]+$/, "") === filename.replace(/\.[^/.]+$/, "") ||
          sourceTitle.replace(/\.[^/.]+$/, "") === filename.replace(/\.[^/.]+$/, "")
        );
      });

      console.log('Found matching source:', matchingSource);

      if (matchingSource) {
        return {
          title: matchingSource.metadata.documentTitle || matchingSource.metadata.source || filename,
          content: matchingSource.content,
          source: matchingSource.metadata.source || 'Unknown Source',
          pageNumber: matchingSource.metadata.pageNumber,
          documentId: matchingSource.documentId,
        };
      }

      // If we have sources but no match, show the first source as an example
      if (sources && sources.length > 0) {
        const firstSource = sources[0];
        return {
          title: `${filename} (Example from available sources)`,
          content: firstSource.content,
          source: firstSource.metadata.source || 'Unknown Source',
          pageNumber: firstSource.metadata.pageNumber,
          documentId: firstSource.documentId,
        };
      }

      // Fallback if no sources available at all
      return {
        title: filename || 'Source Document',
        content: `Reference to: ${filename || 'Unknown Document'}\n\nOriginal Reference: ${href}\n\nThis source was mentioned in the response but the full content is not available in the current context. The AI assistant referenced this document when generating the response.\n\nTo see the actual content, make sure the source documents are included in the message data.`,
        source: filename || href,
      };
    }

    return null;
  };

  // Custom components for markdown rendering
  const components: any = {
    a: ({ href, children, ...props }: any) => {
      // Check if this looks like a citation
      const childrenText = String(children);
      const isCitation = href && (
        href.startsWith('sandbox:') || 
        href.includes('evergreen') || 
        childrenText.includes('^') || 
        childrenText.includes('LOOT BOX') ||
        href.includes('#') ||
        childrenText.match(/\.(txt|pdf|doc|docx)/i)
      );
      
      if (isCitation) {
        // This is a source citation
        const sourceRef = extractSourceReference(href, childrenText);
        
        return (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setSelectedSource(sourceRef);
              setShowSourceModal(true);
            }}
            className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded-md transition-colors text-sm font-medium cursor-pointer"
            title="Click to view source details"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>{childrenText.replace(/\[|\]|\^/g, '').trim()}</span>
          </button>
        );
      }

      // Regular link - only if it's a valid URL
      if (href && (href.startsWith('http') || href.startsWith('https') || href.startsWith('mailto:'))) {
        return (
          <a 
            href={href} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
            {...props}
          >
            {children}
          </a>
        );
      }

      // Fallback for other links - treat as citation
      const sourceRef = extractSourceReference(href || '', childrenText);
      return (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setSelectedSource(sourceRef);
            setShowSourceModal(true);
          }}
          className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded-md transition-colors text-sm font-medium cursor-pointer"
          title="Click to view source details"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>{childrenText.replace(/\[|\]|\^/g, '').trim()}</span>
        </button>
      );
    },
    
    // Style code blocks
    code: ({ children, className, ...props }: any) => {
      const isInline = !className;
      
      if (isInline) {
        return (
          <code className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-sm font-mono">
            {children}
          </code>
        );
      }
      
      return (
        <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-x-auto">
          <code className="text-sm font-mono text-gray-800">
            {children}
          </code>
        </pre>
      );
    },

    // Style blockquotes
    blockquote: ({ children, ...props }: any) => (
      <blockquote className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 rounded-r-lg my-4" {...props}>
        <div className="text-gray-700 italic">
          {children}
        </div>
      </blockquote>
    ),

    // Style lists
    ul: ({ children, ...props }: any) => (
      <ul className="list-disc list-inside space-y-1 my-2" {...props}>
        {children}
      </ul>
    ),

    ol: ({ children, ...props }: any) => (
      <ol className="list-decimal list-inside space-y-1 my-2" {...props}>
        {children}
      </ol>
    ),

    // Style headings
    h1: ({ children, ...props }: any) => (
      <h1 className="text-2xl font-bold text-gray-900 mb-4 mt-6 first:mt-0" {...props}>
        {children}
      </h1>
    ),

    h2: ({ children, ...props }: any) => (
      <h2 className="text-xl font-semibold text-gray-900 mb-3 mt-5 first:mt-0" {...props}>
        {children}
      </h2>
    ),

    h3: ({ children, ...props }: any) => (
      <h3 className="text-lg font-medium text-gray-900 mb-2 mt-4 first:mt-0" {...props}>
        {children}
      </h3>
    ),

    // Style paragraphs
    p: ({ children, ...props }: any) => (
      <p className="mb-3 leading-relaxed" {...props}>
        {children}
      </p>
    ),

    // Style tables
    table: ({ children, ...props }: any) => (
      <div className="overflow-x-auto my-4">
        <table className="min-w-full border border-gray-200 rounded-lg" {...props}>
          {children}
        </table>
      </div>
    ),

    th: ({ children, ...props }: any) => (
      <th className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-left font-semibold text-gray-900" {...props}>
        {children}
      </th>
    ),

    td: ({ children, ...props }: any) => (
      <td className="px-4 py-2 border-b border-gray-100 text-gray-700" {...props}>
        {children}
      </td>
    ),
  };

  return (
    <>
      <div className="prose prose-sm max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={components}
        >
          {content}
        </ReactMarkdown>
      </div>

      {/* Source Modal */}
      <SourceModal
        isOpen={showSourceModal}
        onClose={() => {
          setShowSourceModal(false);
          setSelectedSource(null);
        }}
        source={selectedSource}
      />
    </>
  );
} 