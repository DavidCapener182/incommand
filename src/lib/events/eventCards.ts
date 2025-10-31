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
      const PlaceholderComponent = ({ currentEventId, currentEvent, coordinates, filters }: any) =>
        React.createElement('div', { className: 'text-center text-gray-500 p-8' }, 'Event cards not implemented yet for this event type');
      PlaceholderComponent.displayName = 'EventCardsPlaceholder';
      return PlaceholderComponent;
  }
}

// Alternative naming for consistency
export const cardForType = getCardsForType;



