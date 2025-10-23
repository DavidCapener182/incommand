/**
 * Debug component to help identify incident form validation issues
 */

import React from 'react';

interface IncidentFormData {
  callsign_from: string;
  callsign_to: string;
  occurrence: string;
  incident_type: string;
  action_taken: string;
  priority: string;
  location: string;
  time_of_occurrence?: string;
  entry_type?: 'contemporaneous' | 'retrospective';
  retrospective_justification?: string;
}

interface Props {
  formData: IncidentFormData;
  eventId?: string;
  isVisible?: boolean;
}

export default function IncidentFormDebugger({ formData, eventId, isVisible = false }: Props) {
  if (!isVisible) return null;

  const validationChecks = [
    {
      name: 'Event ID',
      isValid: !!eventId,
      value: eventId || 'Missing',
      required: true
    },
    {
      name: 'Callsign From',
      isValid: !!formData.callsign_from?.trim(),
      value: formData.callsign_from || 'Empty',
      required: true
    },
    {
      name: 'Callsign To',
      isValid: !!formData.callsign_to?.trim(),
      value: formData.callsign_to || 'Empty',
      required: true
    },
    {
      name: 'Occurrence',
      isValid: !!formData.occurrence?.trim(),
      value: formData.occurrence?.substring(0, 50) + (formData.occurrence?.length > 50 ? '...' : '') || 'Empty',
      required: true
    },
    {
      name: 'Incident Type',
      isValid: !!formData.incident_type?.trim(),
      value: formData.incident_type || 'Empty',
      required: true
    },
    {
      name: 'Priority',
      isValid: !!formData.priority?.trim(),
      value: formData.priority || 'Empty',
      required: true
    },
        {
          name: 'Location',
          isValid: !!formData.location?.trim(),
          value: formData.location || 'Empty',
          required: false
        },
    {
      name: 'Entry Type',
      isValid: !!formData.entry_type,
      value: formData.entry_type || 'Empty',
      required: true
    },
    {
      name: 'Retrospective Justification',
      isValid: formData.entry_type !== 'retrospective' || !!formData.retrospective_justification?.trim(),
      value: formData.retrospective_justification || 'Empty',
      required: formData.entry_type === 'retrospective'
    }
  ];

  const allValid = validationChecks.every(check => check.isValid);

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg shadow-lg max-w-md text-sm z-50">
      <h3 className="font-bold mb-2 text-yellow-400">🔍 Incident Form Debug</h3>
      
      <div className="mb-2">
        <span className={`px-2 py-1 rounded text-xs font-bold ${allValid ? 'bg-green-600' : 'bg-red-600'}`}>
          {allValid ? '✅ VALID' : '❌ INVALID'}
        </span>
      </div>

      <div className="space-y-1 max-h-60 overflow-y-auto">
        {validationChecks.map((check, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className={`text-xs ${check.required ? 'font-semibold' : 'text-gray-300'}`}>
              {check.name}
              {check.required && <span className="text-red-400 ml-1">*</span>}
            </span>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-1 rounded ${check.isValid ? 'bg-green-600' : 'bg-red-600'}`}>
                {check.isValid ? '✓' : '✗'}
              </span>
              <span className="text-xs text-gray-300 max-w-32 truncate">
                {check.value}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-2 pt-2 border-t border-gray-700">
        <div className="text-xs text-gray-400">
          <div>Required fields: {validationChecks.filter(c => c.required && c.isValid).length}/{validationChecks.filter(c => c.required).length}</div>
          <div>All checks: {validationChecks.filter(c => c.isValid).length}/{validationChecks.length}</div>
        </div>
      </div>
    </div>
  );
}
