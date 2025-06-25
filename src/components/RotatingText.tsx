import React, { useEffect, useRef, useState } from 'react';
import './RotatingText.css';

const DEFAULT_ITEMS = [
  'Concerts',
  'Sports Events',
  'Conferences',
  'Festivals',
  'Exhibitions',
  'Theatre Shows',
  'Parades',
  'Ceremonies',
  'Community Gatherings',
  'Charity Events',
  'Corporate Events',
];

interface RotatingTextProps {
  items?: string[];
  interval?: number;
  className?: string;
}

const RotatingText: React.FC<RotatingTextProps> = ({ items = DEFAULT_ITEMS, interval = 2000, className = '' }) => {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<'up' | 'down'>('up');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      setDirection('down');
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % items.length);
        setDirection('up');
      }, 300);
    }, interval);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [index, interval, items.length]);

  return (
    <span className={`rotating-text ${className}`}>
      <span className={`rotating-text-inner rotating-text-${direction}`}>{items[index]}</span>
    </span>
  );
};

export default RotatingText; 