import FootballCards from '@/components/cards/FootballCards';
import ConcertCards from '@/components/cards/ConcertCards';
import ParadeCards from '@/components/cards/ParadeCards';
import FestivalCards from '@/components/cards/FestivalCards';

export function getCardsForType(type?: string | null) {
  const t = (type ?? '').toLowerCase();
  switch (t) {
    case 'football': return FootballCards;
    case 'concert': return ConcertCards;
    case 'parade': return ParadeCards;
    case 'festival': return FestivalCards;
    default: return ConcertCards;
  }
}

// Alternative naming for consistency
export const cardForType = getCardsForType;


