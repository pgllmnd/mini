import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownContentProps {
  readonly content: string;
}

interface CodeProps {
  inline?: boolean;
  className?: string;
  children: React.ReactNode;
}

const Code: React.FC<CodeProps> = React.memo(({ inline, className, children }) => {
  // Extraire le contenu du code
  const codeContent = React.useMemo(() => {
    if (!children) return '';

    let content = '';
    if (Array.isArray(children)) {
      content = children
        .map(child => (typeof child === 'string' ? child : ''))
        .join('');
    } else if (typeof children === 'string') {
      content = children;
    }

    return content.replace(/\n$/, '');
  }, [children]);

  return (
    <code
      className={className}
      style={{
        backgroundColor: '#1E1E1E',
        padding: inline ? '0.2em 0.4em' : '1em',
        borderRadius: '4px',
        display: inline ? 'inline' : 'block',
        whiteSpace: 'pre-wrap',
        color: '#D4D4D4'
      }}
    >
      {codeContent}
    </code>
  );
});

Code.displayName = 'Code';

export const MarkdownContent: React.FC<MarkdownContentProps> = React.memo(({ content }) => {
  return (
    <ReactMarkdown
      components={{
        code: Code as any // On injecte notre composant Code
      }}
    >
      {content}
    </ReactMarkdown>
  );
});

MarkdownContent.displayName = 'MarkdownContent';
