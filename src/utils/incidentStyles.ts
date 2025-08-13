// Centralized incident styling utilities

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

export function getPriorityColor(priority?: Priority): string {
  switch ((priority || '').toLowerCase()) {
    case 'urgent':
      return 'red';
    case 'high':
      return 'orange';
    case 'medium':
      return 'yellow';
    case 'low':
      return 'green';
    default:
      return 'gray';
  }
}

export function getSeverityBorderClass(priority?: Priority): string {
  const color = getPriorityColor(priority);
  switch (color) {
    case 'red':
      return 'border-l-4 border-l-red-500';
    case 'orange':
      return 'border-l-4 border-l-orange-500';
    case 'yellow':
      return 'border-l-4 border-l-yellow-500';
    case 'green':
      return 'border-l-4 border-l-green-500';
    default:
      return 'border-l-4 border-l-gray-300';
  }
}


