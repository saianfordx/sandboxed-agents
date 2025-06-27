'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import 'highlight.js/styles/github-dark.css';

interface MarkdownReaderProps {
  className?: string;
}

export default function MarkdownReader({ className = '' }: MarkdownReaderProps) {
  const [markdownContent, setMarkdownContent] = useState<string>('Loading...');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch the AGENT.md file content
    const fetchMarkdown = async () => {
      try {
        const response = await fetch('/docs/AGENT.md');
        if (response.ok) {
          const content = await response.text();
          setMarkdownContent(content);
        } else {
          setMarkdownContent('# Error\n\nCould not load AGENT.md file.');
        }
      } catch (error) {
        console.error('Error loading markdown:', error);
        setMarkdownContent('# Error\n\nFailed to load the markdown file.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMarkdown();
  }, []);

  if (isLoading) {
    return (
      <div className={`${className} flex items-center justify-center`}>
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-cyan-400 text-sm">Loading documentation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} overflow-y-auto`}>
      <div className="prose prose-invert prose-cyan max-w-none p-6">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight, rehypeRaw]}
          components={{
            h1: ({ children }) => (
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-6 pb-2 border-b border-cyan-500/30">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-3xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mt-8 mb-4 pb-2 border-b border-purple-500/30">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-2xl font-semibold text-cyan-300 mt-6 mb-3 flex items-center">
                <span className="w-2 h-2 bg-cyan-400 rounded-full mr-3"></span>
                {children}
              </h3>
            ),
            h4: ({ children }) => (
              <h4 className="text-xl font-semibold text-purple-300 mt-4 mb-2">
                {children}
              </h4>
            ),
            p: ({ children }) => (
              <p className="text-gray-300 leading-relaxed mb-4">
                {children}
              </p>
            ),
            code: ({ inline, className, children, ...props }: any) => {
              const match = /language-(\w+)/.exec(className || '');
              return !inline && match ? (
                <div className="relative">
                  <div className="absolute top-2 right-2 text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
                    {match[1]}
                  </div>
                  <pre className="bg-gray-900 border border-cyan-500/20 rounded-lg p-4 overflow-x-auto my-4 shadow-lg shadow-cyan-500/10">
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </pre>
                </div>
              ) : (
                <code className="bg-gray-800 text-cyan-300 px-2 py-1 rounded text-sm border border-cyan-500/30" {...props}>
                  {children}
                </code>
              );
            },
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-cyan-500 bg-gray-800/50 pl-4 py-2 my-4 italic text-gray-300">
                {children}
              </blockquote>
            ),
            ul: ({ children }) => (
              <ul className="list-none space-y-2 mb-4">
                {children}
              </ul>
            ),
            li: ({ children }) => (
              <li className="flex items-start">
                <span className="w-2 h-2 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <span className="text-gray-300">{children}</span>
              </li>
            ),
            table: ({ children }) => (
              <div className="overflow-x-auto my-4">
                <table className="w-full border-collapse border border-cyan-500/30 bg-gray-800/50 rounded-lg overflow-hidden">
                  {children}
                </table>
              </div>
            ),
            th: ({ children }) => (
              <th className="border border-cyan-500/30 bg-gradient-to-r from-cyan-600/20 to-purple-600/20 px-4 py-2 text-left text-cyan-300 font-semibold">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="border border-cyan-500/20 px-4 py-2 text-gray-300">
                {children}
              </td>
            ),
            strong: ({ children }) => (
              <strong className="text-cyan-300 font-semibold">
                {children}
              </strong>
            ),
            em: ({ children }) => (
              <em className="text-purple-300">
                {children}
              </em>
            ),
            a: ({ href, children }) => (
              <a 
                href={href} 
                className="text-cyan-400 hover:text-cyan-300 underline decoration-cyan-400/50 hover:decoration-cyan-300 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </a>
            ),
            hr: () => (
              <hr className="border-0 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent my-8" />
            )
          }}
        >
          {markdownContent}
        </ReactMarkdown>
      </div>
    </div>
  );
} 