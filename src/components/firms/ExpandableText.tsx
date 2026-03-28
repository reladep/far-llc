'use client';

import { useState, useRef, useEffect } from 'react';

interface ExpandableTextProps {
  text: string;
  maxLines?: number;
  style?: React.CSSProperties;
}

export default function ExpandableText({ text, maxLines = 4, style }: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false);
  const [needsTruncation, setNeedsTruncation] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    // Check if content exceeds maxLines
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight);
    const maxHeight = lineHeight * maxLines;
    setNeedsTruncation(el.scrollHeight > maxHeight + 4);
  }, [text, maxLines]);

  return (
    <div style={{ position: 'relative' }}>
      <p
        ref={textRef}
        style={{
          ...style,
          overflow: expanded ? 'visible' : 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: expanded ? 'unset' : maxLines,
          WebkitBoxOrient: 'vertical' as const,
          transition: 'max-height 0.3s ease',
        }}
      >
        {text}
      </p>
      {needsTruncation && !expanded && (
        <div style={{
          position: 'relative',
          marginTop: -20,
          paddingTop: 20,
          background: 'linear-gradient(to bottom, rgba(246,248,247,0), var(--white) 60%)',
        }}>
          <button
            onClick={() => setExpanded(true)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--sans)', fontSize: 12, fontWeight: 600,
              color: 'var(--green)', padding: 0,
              letterSpacing: '0.02em',
            }}
          >
            Read more
          </button>
        </div>
      )}
      {needsTruncation && expanded && (
        <button
          onClick={() => setExpanded(false)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--sans)', fontSize: 12, fontWeight: 600,
            color: 'var(--ink-3)', padding: 0, marginTop: 8,
            letterSpacing: '0.02em',
          }}
        >
          Show less
        </button>
      )}
    </div>
  );
}
