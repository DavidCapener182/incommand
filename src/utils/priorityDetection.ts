export type PriorityLevel = 'urgent' | 'high' | 'medium' | 'low';

export interface PriorityKeywords {
  urgent: string[];
  high: string[];
  medium: string[];
  low: string[];
}

export interface PriorityScore {
  level: PriorityLevel;
  score: number;
}

const DEFAULT_KEYWORDS: PriorityKeywords = {
  urgent: [
    'medical',
    'medic',
    'unconscious',
    'not breathing',
    'cpr',
    'seizure',
    'cardiac',
    'stroke',
    'weapon',
    'knife',
    'gun',
    'fight',
    'fighting',
    'violence',
    'missing child',
    'child missing',
    'fire',
    'collapsed',
    'bleeding heavily',
    'rape',
    'sexual assault',
    'sexual misconduct',
    'assault'
  ],
  high: [
    'ejection',
    'ejected',
    'remove',
    'removed',
    'aggressive',
    'assault',
    'intoxicated',
    'spike',
    'spiked',
    'technical failure',
    'power failure',
    'unattended bag',
    'crowd surge',
    'crush'
  ],
  medium: [
    'refusal',
    'refused',
    'queue',
    'queuing',
    'welfare',
    'distressed',
    'unwell',
    'lost person',
    'found person'
  ],
  low: [
    'lost property',
    'missing property',
    'general inquiry',
    'information',
    'noise complaint',
    'request'
  ]
};

export function getPriorityFromKeywords(input: string, keywords: PriorityKeywords = DEFAULT_KEYWORDS): PriorityScore {
  const text = input.toLowerCase();
  const levelWeights: Record<PriorityLevel, number> = {
    urgent: 4,
    high: 3,
    medium: 2,
    low: 1
  };

  const scores: PriorityScore[] = (Object.keys(keywords) as PriorityLevel[]).map((level) => {
    const hits = keywords[level].reduce((count, kw) => count + (text.includes(kw) ? 1 : 0), 0);
    return { level, score: hits * levelWeights[level] };
  });

  scores.sort((a, b) => b.score - a.score);

  return scores[0] || { level: 'medium', score: 0 };
}

export function detectPriority(input: string, keywords: PriorityKeywords = DEFAULT_KEYWORDS): PriorityLevel {
  const best = getPriorityFromKeywords(input, keywords);
  if (best.score === 0) return 'medium';
  return best.level;
}


