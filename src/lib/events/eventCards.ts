import React from 'react';
import SupportToolsFootball from '@/components/cards/football/SupportToolsFootball';
// TODO: Create missing card components for other event types
// import ConcertCards from '@/components/cards/ConcertCards';
// import ParadeCards from '@/components/cards/ParadeCards';
// import FestivalCards from '@/components/cards/FestivalCards';

export function getCardsForType(type?: string | null) {
  const t = (type ?? '').toLowerCase();
  switch (t) {
    case 'football': return SupportToolsFootball;
    // TODO: Implement other event types
    case 'concert':
    case 'parade':
    case 'festival':
    default:
      // Return a placeholder component for now
      return () => React.createElement('div', null, 'Event cards not implemented yet');
  }
}

// Alternative naming for consistency
export const cardForType = getCardsForType;



