import { FootballData } from "@/types/football";

export const footballStubData: FootballData = {
  fixture: "Liverpool v Everton",
  matchDate: "2025-10-26",
  liveScore: {
    home: 0,
    away: 0,
    time: "0:00",
    phase: "Pre-Match",
    cards: { yellow: 0, red: 0 },
    subs: 0,
    homeTeam: "Liverpool",
    awayTeam: "Everton",
    competition: "Premier League",
  },
  occupancy: {
    "Main Stand": { current: 18240, capacity: 20000 },
    "Kop Stand": { current: 15980, capacity: 16500 },
    "Anfield Road End": { current: 13050, capacity: 13500 },
    "Sir Kenny Dalglish Stand": { current: 14890, capacity: 15000 },
  },
  gateStatus: {
    openTime: "18:30",
    totalTurnstiles: 50,
    activeTurnstiles: 45,
    entryRate: 12500,
    queueAlerts: ["Gate D – High"],
    predictedFullEntry: "19:55",
  },
  medicalPolicing: {
    medicalTeams: 6,
    policeDeployed: 180,
    stewards: 45,
  },
  transportWeather: {
    transport: {
      rail: "Operating Normally",
      buses: "60% Capacity",
      taxi: "Moderate Wait (~10 mins)",
      roadClosures: ["Walton Breck Rd (Planned)"],
    },
    weather: {
      temp: 12,
      wind: "5m/s",
      condition: "Overcast",
      risk: "Medium",
    },
  },
};


