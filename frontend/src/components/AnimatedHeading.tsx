import { useEffect, useState } from 'react';

interface AnimatedHeadingProps {
  text: string; // may contain \n for line breaks
  initialDelay?: number; // ms before animation starts
  charDelay?: number; // ms between characters
}

export default function AnimatedHeading({
  text,
  initialDelay = 200,
  charDelay = 30,
}: AnimatedHeadingProps) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setReady(true), initialDelay);
    return () => clearTimeout(id);
  }, [initialDelay]);

  const lines = text.split('\n');

  return (
    <div className="leading-tight">
      {lines.map((line, lineIdx) => (
        <div key={lineIdx} className="flex flex-wrap">
          {Array.from(line).map((char, charIdx) => {
            const delay = lineIdx * line.length * charDelay + charIdx * charDelay;
            const style = {
              transition: `opacity 500ms ease, transform 500ms ease`,
              transitionDelay: `${delay}ms`,
              opacity: ready ? 1 : 0,
              transform: ready ? 'translateX(0)' : 'translateX(-18px)',
            };
            const displayChar = char === ' ' ? '\u00A0' : char;
            return (
              <span
                key={charIdx}
                style={style}
                className="inline-block"
                aria-hidden="true"
              >
                {displayChar}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}
