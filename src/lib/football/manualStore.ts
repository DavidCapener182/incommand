import { FootballData, FootballManualOverrides, StandsSetup, StaffingData, FixtureChecklist, GatesSetup, TransportConfig } from "@/types/football";
import { footballStubData } from "@/lib/football/stubData";

// Simple in-memory store for operator overrides.
// Intentionally ephemeral; survives per-instance only.
let overrides: FootballManualOverrides = {};

// Extended stores for new modal data
let standsSetup: StandsSetup = {
  stands: [
    { id: "main", name: "Main Stand", capacity: 20000, order: 1 },
    { id: "kop", name: "Kop Stand", capacity: 16500, order: 2 },
    { id: "anfield-road", name: "Anfield Road End", capacity: 13500, order: 3 },
    { id: "kenny-dalglish", name: "Sir Kenny Dalglish Stand", capacity: 15000, order: 4 },
  ],
  totalCapacity: 65000,
};

let staffingData: StaffingData = {
  roles: [
    { id: "police", name: "Police", planned: 180, actual: 180, icon: "👮", color: "blue" },
    { id: "stewards", name: "Stewards", planned: 45, actual: 45, icon: "🦺", color: "orange" },
    { id: "medical", name: "Medical", planned: 6, actual: 6, icon: "🚑", color: "red" },
  ],
};

let fixtureChecklist: FixtureChecklist = {
  fixture: "Liverpool v Everton",
  tasks: [
    { id: "1", minute: 15, description: "Check stairwells", assignedRole: "Stewards", completed: true, completedAt: "2025-01-26T19:15:00Z", completedBy: "John Smith" },
    { id: "2", minute: 45, description: "Half-time staff check", assignedRole: "Safety Officer", completed: false },
    { id: "3", minute: 80, description: "Open exit gates", assignedRole: "Stewards", completed: false },
  ],
};

let gatesSetup: GatesSetup = {
  gates: [
    { id: "A", name: "Gate A", status: "active", entryRate: 12500, threshold: 90, sensorId: "GATE_A_001" },
    { id: "B", name: "Gate B", status: "active", entryRate: 11000, threshold: 85, sensorId: "GATE_B_001" },
    { id: "C", name: "Gate C", status: "delayed", entryRate: 7500, threshold: 80, sensorId: "GATE_C_001" },
    { id: "D", name: "Gate D", status: "active", entryRate: 9500, threshold: 75, sensorId: "GATE_D_001" },
  ],
};

let transportConfig: TransportConfig = {
  location: "Anfield, L4 0TH",
  postcode: "L4 0TH",
  coordinates: { lat: 53.4308, lng: -2.9608 },
  providers: ["TfL", "National Rail", "Highways England"],
  radius: 3,
  issues: [
    {
      id: "issue-1",
      type: "Bus",
      description: "Route 26 experiencing delays due to roadworks",
      severity: "medium",
      timestamp: "2025-01-26T18:30:00Z",
    },
    {
      id: "issue-2", 
      type: "Rail",
      description: "Merseyrail services running 5 minutes late",
      severity: "low",
      timestamp: "2025-01-26T18:45:00Z",
    },
  ],
};

export function getManualOverrides(): FootballManualOverrides {
  return overrides;
}

export function updateManualOverrides(update: FootballManualOverrides): FootballManualOverrides {
  // Shallow merge with special handling for nested objects
  overrides = deepMerge(overrides, update);
  return overrides;
}

export function getMergedFootballData(): FootballData {
  return deepMerge(structuredClone(footballStubData), overrides);
}

// Getters for new modal data
export function getStandsSetup(): StandsSetup {
  return structuredClone(standsSetup);
}

export function getStaffingData(): StaffingData {
  return structuredClone(staffingData);
}

export function getFixtureChecklist(): FixtureChecklist {
  return structuredClone(fixtureChecklist);
}

export function getGatesSetup(): GatesSetup {
  return structuredClone(gatesSetup);
}

export function getTransportConfig(): TransportConfig {
  return structuredClone(transportConfig);
}

// Setters for new modal data
export function updateStandsSetup(update: Partial<StandsSetup>): StandsSetup {
  standsSetup = deepMerge(standsSetup, update);
  return structuredClone(standsSetup);
}

export function updateStaffingData(update: Partial<StaffingData>): StaffingData {
  staffingData = deepMerge(staffingData, update);
  return structuredClone(staffingData);
}

export function updateFixtureChecklist(update: Partial<FixtureChecklist>): FixtureChecklist {
  fixtureChecklist = deepMerge(fixtureChecklist, update);
  return structuredClone(fixtureChecklist);
}

export function updateGatesSetup(update: Partial<GatesSetup>): GatesSetup {
  gatesSetup = deepMerge(gatesSetup, update);
  return structuredClone(gatesSetup);
}

export function updateTransportConfig(update: Partial<TransportConfig>): TransportConfig {
  transportConfig = deepMerge(transportConfig, update);
  return structuredClone(transportConfig);
}

// Deep merge utility preserving nested shape for Partial overrides
function isObject(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deepMerge<T>(target: T, source: any): T {
  if (!isObject(source)) return (source as T) ?? target;
  const out: any = Array.isArray(target) ? [...(target as any)] : { ...(target as any) };
  for (const key of Object.keys(source)) {
    const srcVal = (source as any)[key];
    const tgtVal = (out as any)[key];
    if (Array.isArray(srcVal)) {
      out[key] = srcVal; // replace arrays
    } else if (isObject(srcVal) && isObject(tgtVal)) {
      out[key] = deepMerge(tgtVal, srcVal);
    } else if (srcVal !== undefined) {
      out[key] = srcVal;
    }
  }
  return out as T;
}


