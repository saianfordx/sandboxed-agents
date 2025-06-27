export interface ClarificationRequest {
  question: string;
  suggestions: string[];
  confidence: number; // 0-1, how confident we are that clarification is needed
  type: 'typo' | 'ambiguous' | 'incomplete' | 'unclear_intent';
}

export function analyzeQueryForClarification(query: string): ClarificationRequest | null {
  const trimmedQuery = query.trim().toLowerCase();
  
  // Check for potential typos
  const typoCheck = detectPotentialTypos(trimmedQuery);
  if (typoCheck) return typoCheck;
  
  // Check for ambiguous terms
  const ambiguityCheck = detectAmbiguousTerms(trimmedQuery);
  if (ambiguityCheck) return ambiguityCheck;
  
  // Check for incomplete requests
  const incompleteCheck = detectIncompleteRequests(trimmedQuery);
  if (incompleteCheck) return incompleteCheck;
  
  // Check for unclear intent
  const intentCheck = detectUnclearIntent(trimmedQuery);
  if (intentCheck) return intentCheck;
  
  return null;
}

function detectPotentialTypos(query: string): ClarificationRequest | null {
  const commonTypos = [
    { wrong: 'ingo', correct: 'info', context: 'information' },
    { wrong: 'infromation', correct: 'information', context: 'information' },
    { wrong: 'imag', correct: 'image', context: 'image' },
    { wrong: 'creat', correct: 'create', context: 'create' },
    { wrong: 'generat', correct: 'generate', context: 'generate' },
    { wrong: 'documnet', correct: 'document', context: 'document' },
    { wrong: 'sumary', correct: 'summary', context: 'summary' },
    { wrong: 'analyz', correct: 'analyze', context: 'analyze' },
    { wrong: 'explin', correct: 'explain', context: 'explain' },
  ];

  for (const typo of commonTypos) {
    if (query.includes(typo.wrong)) {
      return {
        question: `I noticed you wrote "${typo.wrong}" - did you mean "${typo.correct}"? I want to make sure I understand what you're looking for!`,
        suggestions: [
          `Yes, I meant "${typo.correct}"`,
          `Actually, I meant something else - let me clarify`,
          `No, "${typo.wrong}" is correct as written`
        ],
        confidence: 0.8,
        type: 'typo'
      };
    }
  }

  // Check for words that might be cut off
  const cutOffPatterns = [
    /\b\w{1,2}[aeiou]?\b/g, // Very short words that might be incomplete
    /\b\w+[^aeiou\s]\b/g    // Words ending in consonants that might be cut off
  ];

  const shortWords = query.match(/\b\w{1,3}\b/g) || [];
  const suspiciousWords = shortWords.filter(word => 
    !['a', 'an', 'the', 'is', 'it', 'in', 'on', 'at', 'to', 'of', 'or', 'and', 'but', 'for', 'so', 'yet', 'i', 'me', 'my', 'be', 'do', 'go', 'no', 'up', 'if', 'as', 'we', 'he', 'she', 'you', 'can', 'may', 'get', 'set', 'put', 'cut', 'run', 'see', 'try', 'use', 'new', 'old', 'big', 'top', 'end', 'yes', 'now', 'how', 'why', 'who', 'all', 'any', 'few', 'lot', 'way', 'day', 'job', 'app', 'api', 'url', 'pdf', 'doc', 'csv', 'xml', 'sql', 'ui', 'ux', 'ai', 'ml', 'id', 'os', 'db', 'js', 'ts', 'py', 'go', 'rb', 'rs', 'c', 'r'].includes(word.toLowerCase())
  );

  if (suspiciousWords.length > 0) {
    return {
      question: `I noticed some short words in your message: "${suspiciousWords.join('", "')}" - are any of these incomplete or typos? I want to make sure I understand correctly!`,
      suggestions: [
        `Let me rephrase my question more clearly`,
        `Those words are correct as written`,
        `Yes, some of those might be typos - let me clarify`
      ],
      confidence: 0.6,
      type: 'typo'
    };
  }

  return null;
}

function detectAmbiguousTerms(query: string): ClarificationRequest | null {
  const ambiguousTerms = [
    {
      term: 'image',
      question: 'When you say "image", do you mean:',
      suggestions: [
        'Generate/create a new image',
        'Analyze an existing image',
        'Find images in my documents',
        'Extract text from an image'
      ]
    },
    {
      term: 'document',
      question: 'When you mention "document", are you referring to:',
      suggestions: [
        'Search through my uploaded documents',
        'Create a new document',
        'Analyze a specific document format',
        'Get information about document structure'
      ]
    },
    {
      term: 'analyze',
      question: 'What type of analysis are you looking for:',
      suggestions: [
        'Summarize the content',
        'Extract key information',
        'Compare different sections',
        'Identify patterns or trends'
      ]
    }
  ];

  for (const term of ambiguousTerms) {
    if (query.includes(term.term)) {
      // Check if the context makes it clear what they mean
      const hasContext = query.includes('create') || query.includes('generate') || 
                        query.includes('make') || query.includes('find') || 
                        query.includes('search') || query.includes('analyze');
      
      if (!hasContext) {
        return {
          question: term.question,
          suggestions: term.suggestions,
          confidence: 0.7,
          type: 'ambiguous'
        };
      }
    }
  }

  return null;
}

function detectIncompleteRequests(query: string): ClarificationRequest | null {
  const incompletePatterns = [
    /^(can you|could you|please|i want|i need|help me)\s*$/i,
    /^(what|how|when|where|why)\s*$/i,
    /^(create|make|generate|find|search)\s*$/i,
  ];

  for (const pattern of incompletePatterns) {
    if (pattern.test(query)) {
      return {
        question: 'It looks like your request might be incomplete - could you tell me more about what you need help with?',
        suggestions: [
          'I need help with document analysis',
          'I want to generate an image',
          'I need to search for information',
          'I want to create something specific'
        ],
        confidence: 0.9,
        type: 'incomplete'
      };
    }
  }

  // Check for very short queries that might be incomplete
  if (query.split(' ').length <= 2 && query.length < 10) {
    return {
      question: 'Your message seems quite brief - could you provide a bit more detail about what you\'re looking for?',
      suggestions: [
        'Let me explain what I need in more detail',
        'I want to search my documents for specific information',
        'I need help with a specific task',
        'Actually, my request is complete as written'
      ],
      confidence: 0.6,
      type: 'incomplete'
    };
  }

  return null;
}

function detectUnclearIntent(query: string): ClarificationRequest | null {
  const vaguePhrases = [
    'something', 'anything', 'stuff', 'things', 'whatever', 'somehow', 'somewhere'
  ];

  const hasVaguePhrase = vaguePhrases.some(phrase => query.includes(phrase));
  
  if (hasVaguePhrase) {
    return {
      question: 'I want to help you effectively! Could you be more specific about what you\'re looking for?',
      suggestions: [
        'Let me be more specific about my request',
        'I need help finding specific information',
        'I want to create something particular',
        'I need assistance with a specific task'
      ],
      confidence: 0.7,
      type: 'unclear_intent'
    };
  }

  // Check for conflicting intents
  const hasCreateIntent = /create|make|generate|build|design/i.test(query);
  const hasSearchIntent = /find|search|look|locate|get/i.test(query);
  const hasAnalyzeIntent = /analyze|explain|summarize|review/i.test(query);

  const intentCount = [hasCreateIntent, hasSearchIntent, hasAnalyzeIntent].filter(Boolean).length;
  
  if (intentCount > 1) {
    return {
      question: 'I see multiple possible actions in your request. What would you like me to focus on first?',
      suggestions: [
        'Create/generate something new',
        'Search for existing information',
        'Analyze/explain something',
        'Do all of these tasks in sequence'
      ],
      confidence: 0.6,
      type: 'unclear_intent'
    };
  }

  return null;
}

export function shouldRequestClarification(query: string): boolean {
  const clarificationRequest = analyzeQueryForClarification(query);
  return clarificationRequest !== null && clarificationRequest.confidence > 0.6;
} 