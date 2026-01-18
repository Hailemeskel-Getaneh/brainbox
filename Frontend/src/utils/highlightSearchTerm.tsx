import React from 'react';

export const highlightSearchTerm = (content: string, searchTerm: string): React.ReactNode[] => {
  if (!searchTerm || !content) {
    return [content];
  }

  const parts: React.ReactNode[] = [];
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  let lastIndex = 0;

  content.replace(regex, (match, p1, offset) => {
    // Add the part before the match
    if (offset > lastIndex) {
      parts.push(content.substring(lastIndex, offset));
    }
    // Add the highlighted match
    parts.push(<span key={offset} className="highlight">{p1}</span>);
    lastIndex = offset + p1.length;
    return match;
  });

  // Add the remaining part after the last match
  if (lastIndex < content.length) {
    parts.push(content.substring(lastIndex));
  }

  return parts;
};