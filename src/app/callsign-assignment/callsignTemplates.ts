export type CallsignPosition = { callsign: string; position: string; group: string };

export const callsignTemplates: Record<string, CallsignPosition[]> = {
  concert: [
    { callsign: 'ALPHA 1', position: 'HOS', group: 'Management' },
    { callsign: 'ALPHA 2', position: 'Site Co', group: 'Management' },
    { callsign: 'ALPHA 3', position: 'Internal Co', group: 'Management' },
    { callsign: 'ALPHA 4', position: 'Queue Management', group: 'Venue Operations' },
    { callsign: 'SIERRA 1', position: 'Queue Management', group: 'Venue Operations' },
    { callsign: 'SIERRA 2', position: 'Search Supervisor', group: 'External' },
    { callsign: 'SIERRA 3', position: 'Pit Supervisor', group: 'Internal' },
    { callsign: 'SIERRA 4', position: 'BOH Supervisor', group: 'Internal' },
    { callsign: 'SIERRA 5', position: 'Mezzanine', group: 'Venue Operations' },
    { callsign: 'SIERRA 6', position: 'Stage Right', group: 'Venue Operations' },
    { callsign: 'SIERRA 7', position: 'Stage Left', group: 'Venue Operations' },
    { callsign: 'SIERRA 8', position: 'Access Escort', group: 'Traffic Management' },
    { callsign: 'SIERRA 9', position: 'Staff Gate Hotel gate', group: 'Traffic Management' },
    { callsign: 'SIERRA 10', position: 'Mezzanine Clicker', group: 'Traffic Management' },
    { callsign: 'SIERRA 11', position: 'Mixer', group: 'Venue Operations' },
    { callsign: 'SIERRA 12', position: 'BOH fire exit', group: 'Venue Operations' },
    { callsign: 'SIERRA 13', position: 'Side Gate', group: 'Venue Operations' },
    { callsign: 'SIERRA 14', position: 'Fire exit Shed A Canal', group: 'Venue Operations' },
    { callsign: 'SIERRA 15', position: 'Fire exit Shed A Canal', group: 'Venue Operations' },
    { callsign: 'SIERRA 16', position: 'Cloakroom', group: 'Venue Operations' },
    { callsign: 'SIERRA 17', position: 'E3 Carpark', group: 'Venue Operations' },
    { callsign: 'SIERRA 18', position: '', group: 'Venue Operations' },
    { callsign: 'SIERRA 19', position: '', group: 'Venue Operations' },
    { callsign: 'PAPA MIKE', position: 'Production Manager', group: 'Management' },
    { callsign: 'DELTA MIKE', position: 'Duty Manager', group: 'Management' },
    { callsign: 'RESPONSE 1', position: 'Romeo 1', group: 'Internal' },
    { callsign: 'Medic 1', position: 'Medical Team', group: 'Medic' },
  ],
  festival: [
    // Add festival-specific callsign/position/group objects here
  ],
  // Add more event types as needed
}; 