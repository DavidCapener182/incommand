export type IncidentPriority = 'urgent' | 'high' | 'medium' | 'low';

interface IncidentRule {
  keywords: string[];
  priority?: IncidentPriority;
}

type IncidentLogicMap = Record<string, IncidentRule>;

const LOGIC_MAP: IncidentLogicMap = {
  Attendance: {
    keywords: ['current attendance', 'current numbers', 'attendance'],
    priority: 'low'
  },
  Ejection: {
    keywords: ['ejection', 'removed from', 'escorted out'],
    priority: 'high'
  },
  Refusal: {
    keywords: ['refusal', 'refused entry', 'refused service']
  },
  Medical: {
    keywords: ['medical', 'first aid', 'medic', 'injury', 'collapse']
  },
  Welfare: {
    keywords: ['welfare', 'wellbeing', 'support', 'assistance']
  },
  'Suspicious Behaviour': {
    keywords: ['suspicious', 'acting strangely', 'unusual behaviour']
  },
  'Lost Property': {
    keywords: ['lost', 'missing', 'dropped', 'left behind']
  },
  'Site Issue': {
    keywords: ['site issue', 'damage', 'broken', 'hazard']
  },
  'Tech Issue': {
    keywords: ['tech issue', 'equipment failure', 'system down', 'power cut']
  },
  Environmental: {
    keywords: ['spill', 'weather', 'flood', 'ice', 'environmental']
  },
  'Alcohol / Drug Related': {
    keywords: ['alcohol', 'drunk', 'intoxicated', 'drugs', 'substance']
  },
  'Weapon Related': {
    keywords: ['weapon', 'knife', 'gun', 'firearm'],
    priority: 'high'
  },
  'Artist Movement': {
    keywords: ['artist moving', 'escort artist', 'band move']
  },
  'Artist On Stage': {
    keywords: ['artist on stage', 'main act started']
  },
  'Artist Off Stage': {
    keywords: ['artist off stage', 'main act finished']
  },
  'Sexual Misconduct': {
    keywords: ['sexual', 'harassment', 'inappropriate touching'],
    priority: 'high'
  },
  'Event Timing': {
    keywords: ['timing', 'delayed', 'running late', 'schedule']
  },
  Timings: {
    keywords: ['time', 'set time', 'stage time']
  },
  'Sit Rep': {
    keywords: ['sit rep', 'situation report', 'update']
  },
  'Crowd Management': {
    keywords: ['crowd', 'dense', 'surge', 'movement', 'queue']
  },
  'Hostile Act': {
    keywords: ['hostile', 'aggressive', 'attack', 'threat'],
    priority: 'high'
  },
  'Fire Alarm': {
    keywords: ['fire alarm', 'alarm activated', 'alarm sounding'],
    priority: 'high'
  },
  'Noise Complaint': {
    keywords: ['noise', 'too loud', 'sound complaint']
  },
  Evacuation: {
    keywords: ['evacuation', 'evacuate', 'clear area'],
    priority: 'high'
  },
  'Counter-Terror Alert': {
    keywords: ['suspect package', 'bomb', 'terror', 'explosive'],
    priority: 'high'
  },
  'Entry Breach': {
    keywords: ['entry breach', 'gate breach', 'forced entry']
  },
  Theft: {
    keywords: ['theft', 'stolen', 'pickpocket']
  },
  'Emergency Show Stop': {
    keywords: ['show stop', 'stop performance'],
    priority: 'high'
  },
  'Animal Incident': {
    keywords: ['animal', 'dog', 'wildlife']
  },
  'Missing Child/Person': {
    keywords: ['missing child', 'lost child', 'missing person']
  },
  Accreditation: {
    keywords: ['accreditation', 'pass issue', 'credential problem']
  },
  Staffing: {
    keywords: ['staff', 'staff issue', 'staff shortage']
  },
  Accessibility: {
    keywords: ['accessibility', 'disabled access', 'wheelchair']
  },
  'Suspected Fire': {
    keywords: ['suspected fire', 'smoke', 'burning smell'],
    priority: 'high'
  },
  Fire: {
    keywords: ['fire', 'flames'],
    priority: 'high'
  },
  Showdown: {
    keywords: ['showdown', 'finale', 'main event']
  },
  Fight: {
    keywords: ['fight', 'altercation', 'brawl'],
    priority: 'high'
  }
};

export interface IncidentDetectionResult {
  incidentType?: string;
  occurrence?: string;
  priority?: IncidentPriority;
}

export function detectIncidentFromText(input: string): IncidentDetectionResult {
  const text = (input || '').toLowerCase();

  // First pass: find best matching type by keywords
  let matchedType: string | undefined;
  for (const [type, rule] of Object.entries(LOGIC_MAP)) {
    if (rule.keywords.some(kw => text.includes(kw))) {
      matchedType = type;
      break;
    }
  }

  if (!matchedType) return {};

  const rule = LOGIC_MAP[matchedType];
  const result: IncidentDetectionResult = { incidentType: matchedType };

  // Generate standardized occurrence for specific types
  if (matchedType === 'Attendance') {
    const numMatch = input.match(/\b(\d{1,3}(?:,\d{3})+|\d+)\b/);
    const raw = numMatch?.[1] || numMatch?.[0];
    const normalized = raw ? raw.replace(/,/g, '') : undefined;
    if (normalized) {
      result.occurrence = `Current Attendance: ${normalized}`;
    } else {
      result.occurrence = input;
    }
  } else {
    result.occurrence = input;
  }

  if (rule.priority) {
    result.priority = rule.priority;
  }

  return result;
}


