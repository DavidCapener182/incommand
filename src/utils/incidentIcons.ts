import type { IconType } from 'react-icons';
import {
  LuCircleHelp,
  LuFlame,
  LuHeart,
  LuShieldCheck,
  LuUsers,
  LuWrench,
} from 'react-icons/lu';

export interface IncidentIconConfig {
  icon: IconType;
  label: string;
}

const INCIDENT_ICON_MAPPINGS: Array<{ test: RegExp; config: IncidentIconConfig }> = [
  {
    test: /(medical|first\s*aids?|injury|ambulance)/i,
    config: { icon: LuHeart, label: 'Medical incident' },
  },
  {
    test: /(security|threat|aggressive|conflict|assault|hostile|police)/i,
    config: { icon: LuShieldCheck, label: 'Security incident' },
  },
  {
    test: /(fire|smoke|alarm|evacuation)/i,
    config: { icon: LuFlame, label: 'Fire incident' },
  },
  {
    test: /(crowd|capacity|queue|entry|egress|attendance|evacuation)/i,
    config: { icon: LuUsers, label: 'Crowd incident' },
  },
  {
    test: /(technical|power|network|system|equipment|it)/i,
    config: { icon: LuWrench, label: 'Technical incident' },
  },
];

export function getIncidentTypeIcon(type?: string): IncidentIconConfig {
  const value = String(type ?? '').trim();
  if (!value) {
    return { icon: LuCircleHelp, label: 'Incident' };
  }

  const match = INCIDENT_ICON_MAPPINGS.find(({ test }) => test.test(value));
  return match ? match.config : { icon: LuCircleHelp, label: 'Incident' };
}
