// Centralized incident styling utilities

import type { IconType } from 'react-icons';
import {
  LuCircleAlert,
  LuCircleCheck,
  LuCircleHelp,
  LuSiren,
  LuTriangleAlert,
} from 'react-icons/lu';

export type IncidentType = string;
export type Priority = 'urgent' | 'high' | 'medium' | 'low' | string;

export function getIncidentTypeStyle(type: IncidentType): string {
  switch (type) {
    case 'Ejection':
      return 'bg-red-100 text-red-800';
    case 'Refusal':
      return 'bg-yellow-100 text-yellow-800';
    case 'Code Green':
      return 'bg-green-100 text-green-800';
    case 'Code Purple':
      return 'bg-purple-100 text-purple-800';
    case 'Code White':
      return 'bg-gray-100 text-gray-800';
    case 'Code Black':
      return 'bg-black text-white';
    case 'Code Pink':
      return 'bg-pink-100 text-pink-800';
    case 'Attendance':
      return 'bg-gray-100 text-gray-800';
    case 'Aggressive Behaviour':
      return 'bg-orange-100 text-orange-800';
    case 'Queue Build-Up':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export type NormalizedPriority = 'urgent' | 'high' | 'medium' | 'low' | 'unknown';

interface PriorityDisplayConfig {
  key: NormalizedPriority;
  label: string;
  borderClass: string;
  badgeClass: string;
  chipActiveClass: string;
  chipInactiveClass: string;
  indicatorClass: string;
  icon: IconType;
}

const PRIORITY_STYLES: Record<NormalizedPriority, PriorityDisplayConfig> = {
  urgent: {
    key: 'urgent',
    label: 'Urgent',
    borderClass: 'border-l-[4px] border-l-red-600',
    badgeClass: 'border border-red-600 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-200',
    chipActiveClass: 'border border-red-600 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-200 shadow-sm',
    chipInactiveClass: 'border border-red-600 text-red-600 dark:text-red-200 bg-transparent hover:bg-red-50 dark:hover:bg-red-900',
    indicatorClass: 'border border-red-600 bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-200',
    icon: LuSiren,
  },
  high: {
    key: 'high',
    label: 'High',
    borderClass: 'border-l-[4px] border-l-red-500',
    badgeClass: 'border border-red-500 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300',
    chipActiveClass: 'border border-red-500 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 shadow-sm',
    chipInactiveClass: 'border border-red-500 text-red-600 dark:text-red-300 bg-transparent hover:bg-red-50 dark:hover:bg-red-900',
    indicatorClass: 'border border-red-500 bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-200',
    icon: LuTriangleAlert,
  },
  medium: {
    key: 'medium',
    label: 'Medium',
    borderClass: 'border-l-[4px] border-l-amber-500',
    badgeClass: 'border border-amber-500 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300',
    chipActiveClass: 'border border-amber-500 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 shadow-sm',
    chipInactiveClass: 'border border-amber-500 text-amber-600 dark:text-amber-300 bg-transparent hover:bg-amber-50 dark:hover:bg-amber-900',
    indicatorClass: 'border border-amber-500 bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-200',
    icon: LuCircleAlert,
  },
  low: {
    key: 'low',
    label: 'Low',
    borderClass: 'border-l-[4px] border-l-green-500',
    badgeClass: 'border border-green-500 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300',
    chipActiveClass: 'border border-green-500 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 shadow-sm',
    chipInactiveClass: 'border border-green-500 text-green-600 dark:text-green-300 bg-transparent hover:bg-green-50 dark:hover:bg-green-900',
    indicatorClass: 'border border-green-500 bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-200',
    icon: LuCircleCheck,
  },
  unknown: {
    key: 'unknown',
    label: 'Unspecified',
    borderClass: 'border-l-[4px] border-l-gray-300',
    badgeClass: 'border border-gray-300 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200',
    chipActiveClass: 'border border-gray-300 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 shadow-sm',
    chipInactiveClass: 'border border-gray-300 text-gray-600 dark:text-gray-300 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800',
    indicatorClass: 'border border-gray-300 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-200',
    icon: LuCircleHelp,
  },
};

export function normalizePriority(priority?: Priority): NormalizedPriority {
  const value = String(priority ?? '').trim().toLowerCase();
  if (!value) return 'unknown';
  if (['urgent', 'critical', 'emergency'].includes(value)) return 'urgent';
  if (['high', 'severe'].includes(value)) return 'high';
  if (['medium', 'moderate'].includes(value)) return 'medium';
  if (['low', 'minor'].includes(value)) return 'low';
  return 'unknown';
}

export function getPriorityDisplayConfig(priority?: Priority): PriorityDisplayConfig {
  return PRIORITY_STYLES[normalizePriority(priority)];
}

export function getPriorityColor(priority?: Priority): string {
  const normalized = normalizePriority(priority);
  if (normalized === 'urgent' || normalized === 'high') return 'red';
  if (normalized === 'medium') return 'amber';
  if (normalized === 'low') return 'green';
  return 'gray';
}

export function getSeverityBorderClass(priority?: Priority): string {
  return getPriorityDisplayConfig(priority).borderClass;
}

export function getPriorityBadgeClass(priority?: Priority): string {
  return getPriorityDisplayConfig(priority).badgeClass;
}

export function getPriorityChipClass(priority?: Priority, active = false): string {
  const config = getPriorityDisplayConfig(priority);
  return active ? config.chipActiveClass : config.chipInactiveClass;
}

export function getPriorityIndicatorClass(priority?: Priority): string {
  return getPriorityDisplayConfig(priority).indicatorClass;
}

export function getPriorityBorderClass(priority?: Priority): string {
  return getPriorityDisplayConfig(priority).borderClass;
}

export function getPriorityIcon(priority?: Priority): IconType {
  return getPriorityDisplayConfig(priority).icon;
}

export function getPriorityLabel(priority?: Priority): string {
  return getPriorityDisplayConfig(priority).label;
}
