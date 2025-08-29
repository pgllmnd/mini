import React, { useState, useCallback } from 'react';
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

  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(codeContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (err) {
      // ignore copy errors silently
      console.error('Copy failed', err);
    }
  }, [codeContent]);

  // Détecter la langue si fournie via className (ex: language-js)
  const language = React.useMemo(() => {
    if (!className) return '';
    const m = className.match(/language-(\w+)/);
    return m ? m[1] : '';
  }, [className]);

  // Inline code: keep simple
  if (inline) {
    return (
      <code
        className={className}
        style={{
          backgroundColor: '#1E1E1E',
          padding: '0.2em 0.4em',
          borderRadius: '4px',
          display: 'inline',
          whiteSpace: 'pre-wrap',
          color: '#D4D4D4'
        }}
      >
        {codeContent}
      </code>
    );
  }

  // Block code: add copy button
  return (
    <div style={{ position: 'relative', margin: '0.5rem 0' }}>
      {/* language badge */}
      {language ? (
        <div
          style={{
            position: 'absolute',
            left: 8,
            top: 8,
            zIndex: 2,
            background: 'rgba(0,0,0,0.35)',
            color: '#fff',
            padding: '4px 8px',
            borderRadius: 6,
            fontSize: 12,
            textTransform: 'uppercase'
          }}
        >
          {language}
        </div>
      ) : null}
      <button
        onClick={handleCopy}
        aria-label={copied ? 'Copied' : 'Copy code'}
        style={{
          position: 'absolute',
          right: 8,
          top: 8,
          zIndex: 2,
          background: 'rgba(0,0,0,0.45)',
          color: '#fff',
          border: 'none',
          padding: '6px 8px',
          borderRadius: 6,
          cursor: 'pointer',
          fontSize: 12
        }}
      >
        {copied ? 'Copied' : 'Copy'}
      </button>

      <code
        className={className}
        style={{
          backgroundColor: '#1E1E1E',
          padding: '1em',
          borderRadius: '4px',
          display: 'block',
          whiteSpace: 'pre-wrap',
          color: '#D4D4D4',
          overflowX: 'auto'
        }}
      >
        {codeContent}
      </code>
    </div>
  );
});

Code.displayName = 'Code';

export const MarkdownContent: React.FC<MarkdownContentProps> = React.memo(({ content }) => {
  // Composants personnalisés pour améliorer le rendu markdown
  const Link: React.FC<any> = ({ href, children }) => {
    const isExternal = typeof href === 'string' && /^(https?:)?\/\//i.test(href);
    return (
      <a
        href={href}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noopener noreferrer' : undefined}
        style={{ color: '#2563eb', textDecoration: 'underline' }}
      >
        {children}
        {isExternal ? <span style={{ marginLeft: 6, fontSize: 12 }}>↗</span> : null}
      </a>
    );
  };

  const Img: React.FC<any> = ({ src, alt }) => (
    // click ouvre l'image dans un nouvel onglet
    // lazy loading et style responsive
    // eslint-disable-next-line jsx-a11y/alt-text
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onClick={() => src && window.open(src, '_blank')}
      style={{ maxWidth: '100%', cursor: 'pointer', borderRadius: 6 }}
    />
  );

  const TableWrapper: React.FC<any> = ({ children }) => (
    <div style={{ overflowX: 'auto', margin: '0.5rem 0' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>{children}</table>
    </div>
  );

  const Heading: React.FC<any> = ({ level, children }) => {
    const text = React.Children.toArray(children)
      .map((c: any) => (typeof c === 'string' ? c : c?.props?.children ?? ''))
      .join('')
      .trim();

    const slug = text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const Tag = `h${level}` as any;
    return (
      <Tag id={slug} style={{ scrollMarginTop: 80 }}>
        {children}
        <a href={`#${slug}`} aria-label="Anchor link" style={{ marginLeft: 8, fontSize: 12, color: '#6b7280' }}>
          #
        </a>
      </Tag>
    );
  };

  return (
    <ReactMarkdown
      components={{
        code: Code as any, // On injecte notre composant Code
        a: Link as any,
        img: Img as any,
        table: TableWrapper as any,
        h1: (props: any) => <Heading level={1} {...props} />,
        h2: (props: any) => <Heading level={2} {...props} />,
        h3: (props: any) => <Heading level={3} {...props} />,
        h4: (props: any) => <Heading level={4} {...props} />,
        h5: (props: any) => <Heading level={5} {...props} />,
        h6: (props: any) => <Heading level={6} {...props} />
      }}
    >
      {content}
    </ReactMarkdown>
  );
});

MarkdownContent.displayName = 'MarkdownContent';
