import React from 'react';

interface LinkifyTextProps {
  text: string;
  className?: string;
}

/**
 * Component that converts URLs in text into clickable links
 */
export function LinkifyText({ text, className }: LinkifyTextProps) {
  // Regex to match URLs (http, https, and www)
  const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi;
  
  const parts = text.split(urlRegex);
  const matches = text.match(urlRegex) || [];
  
  let matchIndex = 0;
  const result: React.ReactNode[] = [];
  
  parts.forEach((part, index) => {
    if (part === undefined) return;
    
    // Check if this part is a URL
    if (urlRegex.test(part)) {
      const url = part.startsWith('www.') ? `https://${part}` : part;
      result.push(
        <a
          key={`link-${index}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline inline-flex items-center gap-1"
        >
          {part}
        </a>
      );
      matchIndex++;
    } else {
      result.push(<span key={`text-${index}`}>{part}</span>);
    }
  });
  
  return <span className={className}>{result}</span>;
}
