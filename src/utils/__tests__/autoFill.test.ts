/**
 * Tests for auto-fill functionality
 */

import { detectIncidentFromText } from '../incidentLogic';
import { detectCallsign } from '../callsignDetection';
import { detectIncidentType } from '../incidentTypeDetection';
import { detectPriority } from '../priorityDetection';

describe('Auto-fill functionality', () => {
  describe('detectIncidentFromText', () => {
    it('should detect medical incidents', () => {
      const result = detectIncidentFromText('Medical at main stage, S1 responding');
      expect(result.incidentType).toBe('Medical');
    });

    it('should detect fight incidents', () => {
      const result = detectIncidentFromText('Fight between two males at north gate');
      expect(result.incidentType).toBe('Fight');
    });

    it('should detect attendance incidents', () => {
      const result = detectIncidentFromText('Current attendance: 3,500');
      expect(result.incidentType).toBe('Attendance');
      expect(result.occurrence).toBe('Current Attendance: 3500');
    });
  });

  describe('detectCallsign', () => {
    it('should detect standard callsigns', () => {
      expect(detectCallsign('This is S1 to Control')).toBe('S1');
      expect(detectCallsign('Alpha 1 reporting')).toBe('A1');
      expect(detectCallsign('Security 2 on scene')).toBe('S2');
    });

    it('should return empty string for no callsign', () => {
      expect(detectCallsign('No callsign in this text')).toBe('');
    });
  });

  describe('detectIncidentType', () => {
    it('should detect incident types', () => {
      expect(detectIncidentType('Medical emergency at main stage')).toBe('Medical');
      expect(detectIncidentType('Fight between two people')).toBe('Fight');
    });
  });

  describe('detectPriority', () => {
    it('should detect urgent priority', () => {
      expect(detectPriority('Medical emergency, not breathing')).toBe('urgent');
      expect(detectPriority('Weapon found on person')).toBe('urgent');
    });

    it('should detect high priority', () => {
      expect(detectPriority('Fight between two males')).toBe('high');
      expect(detectPriority('Person ejected from venue')).toBe('high');
    });

    it('should detect medium priority', () => {
      expect(detectPriority('Person refused entry')).toBe('medium');
      expect(detectPriority('Welfare check needed')).toBe('medium');
    });

    it('should default to medium priority', () => {
      expect(detectPriority('General inquiry about parking')).toBe('medium');
    });
  });
});
