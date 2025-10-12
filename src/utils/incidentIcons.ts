import type { IconType } from 'react-icons';
import {
  LuCircleHelp,
  LuFlame,
  LuHeart,
  LuShieldCheck,
  LuUsers,
  LuWrench,
  LuUserX,
  LuBan,
  LuAlertTriangle,
  LuZap,
  LuEye,
  LuShield,
  LuShieldX,
  LuSword,
  LuClock,
  LuMusic,
  LuMic,
  LuCloud,
  LuSun,
  LuMapPin,
  LuPackage,
  LuUserCheck,
  LuSettings,
  LuAlertCircle,
  LuPhone,
  LuRadio,
} from 'react-icons/lu';

export interface IncidentIconConfig {
  icon: IconType;
  label: string;
}

const INCIDENT_ICON_MAPPINGS: Array<{ test: RegExp; config: IncidentIconConfig }> = [
  // Security & Safety
  { test: /^ejection$/i, config: { icon: LuUserX, label: 'Ejection' } },
  { test: /^refusal$/i, config: { icon: LuBan, label: 'Refusal' } },
  { test: /^aggressive\s*behaviour$/i, config: { icon: LuAlertTriangle, label: 'Aggressive Behaviour' } },
  { test: /^suspicious\s*behaviour$/i, config: { icon: LuEye, label: 'Suspicious Behaviour' } },
  { test: /^hostile\s*act$/i, config: { icon: LuShieldX, label: 'Hostile Act' } },
  { test: /^counter.*terror.*alert$/i, config: { icon: LuShield, label: 'Counter-Terror Alert' } },
  { test: /^sexual\s*misconduct$/i, config: { icon: LuAlertCircle, label: 'Sexual Misconduct' } },
  { test: /^fight$/i, config: { icon: LuSword, label: 'Fight' } },
  { test: /^theft$/i, config: { icon: LuPackage, label: 'Theft' } },
  { test: /^entry\s*breach$/i, config: { icon: LuShieldX, label: 'Entry Breach' } },
  { test: /^weapon\s*related$/i, config: { icon: LuSword, label: 'Weapon Related' } },
  { test: /^emergency\s*show\s*stop$/i, config: { icon: LuAlertTriangle, label: 'Emergency Show Stop' } },
  { test: /^missing\s*child\/person$/i, config: { icon: LuUserCheck, label: 'Missing Child/Person' } },
  { test: /^unattended\s*bag$/i, config: { icon: LuPackage, label: 'Unattended Bag' } },
  
  // Medical & Welfare
  { test: /^medical$/i, config: { icon: LuHeart, label: 'Medical' } },
  { test: /^welfare$/i, config: { icon: LuHeart, label: 'Welfare' } },
  { test: /^alcohol.*drug.*related$/i, config: { icon: LuAlertCircle, label: 'Alcohol / Drug Related' } },
  { test: /^self.*harm.*mental.*health$/i, config: { icon: LuHeart, label: 'Self-Harm/Mental Health' } },
  
  // Fire & Emergency
  { test: /^fire\s*alarm$/i, config: { icon: LuFlame, label: 'Fire Alarm' } },
  { test: /^fire$/i, config: { icon: LuFlame, label: 'Fire' } },
  { test: /^suspected\s*fire$/i, config: { icon: LuFlame, label: 'Suspected Fire' } },
  { test: /^evacuation$/i, config: { icon: LuUsers, label: 'Evacuation' } },
  
  // Crowd & Safety
  { test: /^crowd\s*management$/i, config: { icon: LuUsers, label: 'Crowd Management' } },
  { test: /^queue\s*build.*up$/i, config: { icon: LuUsers, label: 'Queue Build-Up' } },
  { test: /^showdown$/i, config: { icon: LuAlertTriangle, label: 'Showdown' } },
  
  // Operations
  { test: /^site\s*issue$/i, config: { icon: LuWrench, label: 'Site Issue' } },
  { test: /^tech\s*issue$/i, config: { icon: LuWrench, label: 'Tech Issue' } },
  { test: /^environmental$/i, config: { icon: LuCloud, label: 'Environmental' } },
  { test: /^power\s*failure$/i, config: { icon: LuZap, label: 'Power Failure' } },
  { test: /^structural\s*issue$/i, config: { icon: LuWrench, label: 'Structural Issue' } },
  { test: /^accreditation$/i, config: { icon: LuUserCheck, label: 'Accreditation' } },
  { test: /^staffing$/i, config: { icon: LuUsers, label: 'Staffing' } },
  { test: /^accsessablity$/i, config: { icon: LuUserCheck, label: 'Accessibility' } },
  { test: /^lost\s*property$/i, config: { icon: LuPackage, label: 'Lost Property' } },
  { test: /^general$/i, config: { icon: LuSettings, label: 'General' } },
  { test: /^other$/i, config: { icon: LuCircleHelp, label: 'Other' } },
  
  // Event & Artist
  { test: /^artist\s*movement$/i, config: { icon: LuMapPin, label: 'Artist Movement' } },
  { test: /^artist\s*on\s*stage$/i, config: { icon: LuMusic, label: 'Artist On Stage' } },
  { test: /^artist\s*off\s*stage$/i, config: { icon: LuMusic, label: 'Artist Off Stage' } },
  { test: /^event\s*timing$/i, config: { icon: LuClock, label: 'Event Timing' } },
  { test: /^timings$/i, config: { icon: LuClock, label: 'Timings' } },
  
  // Reports & Updates
  { test: /^attendance$/i, config: { icon: LuUsers, label: 'Attendance' } },
  { test: /^sit\s*rep$/i, config: { icon: LuRadio, label: 'Sit Rep' } },
  { test: /^weather\s*disruption$/i, config: { icon: LuCloud, label: 'Weather Disruption' } },
  { test: /^noise\s*complaint$/i, config: { icon: LuMic, label: 'Noise Complaint' } },
  { test: /^crowd\s*density\/overcrowding$/i, config: { icon: LuUsers, label: 'Crowd Density/Overcrowding' } },
  { test: /^local\s*traffic\s*issue$/i, config: { icon: LuMapPin, label: 'Local Traffic Issue' } },
  
  // Fallback patterns
  { test: /(medical|first\s*aids?|injury|ambulance)/i, config: { icon: LuHeart, label: 'Medical incident' } },
  { test: /(security|threat|aggressive|conflict|assault|hostile|police)/i, config: { icon: LuShieldCheck, label: 'Security incident' } },
  { test: /(fire|smoke|alarm|evacuation)/i, config: { icon: LuFlame, label: 'Fire incident' } },
  { test: /(crowd|capacity|queue|entry|egress|attendance|evacuation)/i, config: { icon: LuUsers, label: 'Crowd incident' } },
  { test: /(technical|power|network|system|equipment|it)/i, config: { icon: LuWrench, label: 'Technical incident' } },
];

export function getIncidentTypeIcon(type?: string): IncidentIconConfig {
  const value = String(type ?? '').trim();
  if (!value) {
    return { icon: LuCircleHelp, label: 'Incident' };
  }

  const match = INCIDENT_ICON_MAPPINGS.find(({ test }) => test.test(value));
  return match ? match.config : { icon: LuCircleHelp, label: 'Incident' };
}
