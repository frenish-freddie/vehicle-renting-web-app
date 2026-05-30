"use client";
import { useEffect, useState } from 'react';

interface FadeInProps {
  delay?: number; // milliseconds before showing
  duration?: number; // fade transition duration in ms
  children: React.ReactNode;
}

export default function FadeIn({ delay = 0, duration = 1000, children }: FadeInProps) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(id);
  }, [delay]);

  return (
    <div
      className={`transition-opacity ${visible ? 'opacity-100' : 'opacity-0'}`}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  );
}
