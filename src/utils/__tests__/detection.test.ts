/**
 * Comprehensive tests for optimized detection utilities
 */

import { describe, it, expect } from '@jest/globals'
import { detectCallsign, detectCallsignWithConfidence } from '../callsignDetection'
import {
  detectIncidentType,
  detectIncidentTypeWithConfidence,
  getAlternativeIncidentTypes,
  getAllIncidentTypeMatches
} from '../incidentTypeDetection'
import {
  detectPriority,
  detectPriorityOptimized,
  detectPriorityWithConfidence
} from '../priorityDetection'

describe('Optimized Callsign Detection', () => {
  describe('Standard format detection', () => {
    it('should detect single letter + number callsigns', () => {
      expect(detectCallsign('Medical incident reported by S1')).toBe('S1')
      expect(detectCallsign('A2 responding to scene')).toBe('A2')
      expect(detectCallsign('Contact R5 for update')).toBe('R5')
    })

    it('should detect callsigns with higher numbers', () => {
      expect(detectCallsign('S12 on scene')).toBe('S12')
      expect(detectCallsign('Medical team M100 responding')).toBe('M100')
    })
  })

  describe('NATO phonetic detection', () => {
    it('should detect NATO phonetic callsigns', () => {
      expect(detectCallsign('Alpha 1 on scene')).toBe('A1')
      expect(detectCallsign('Romeo 5 responding')).toBe('R5')
      expect(detectCallsign('Sierra 12 at gate')).toBe('S12')
    })

    it('should handle mixed case', () => {
      expect(detectCallsign('alpha 1 reporting')).toBe('A1')
      expect(detectCallsign('SIERRA 5 on duty')).toBe('S5')
    })
  })

  describe('Prefix-based detection', () => {
    it('should detect Security prefix', () => {
      expect(detectCallsign('Security 1 on patrol')).toBe('S1')
      expect(detectCallsign('Sec 5 responding')).toBe('S5')
    })

    it('should detect Medical prefix', () => {
      expect(detectCallsign('Medical 2 at first aid station')).toBe('M2')
      expect(detectCallsign('Med 3 responding')).toBe('M3')
      expect(detectCallsign('Medic 1 on scene')).toBe('M1')
    })

    it('should detect Staff/Manager prefix', () => {
      expect(detectCallsign('Staff 3 at gate')).toBe('S3')
      expect(detectCallsign('Manager 1 in control')).toBe('M1')
    })
  })

  describe('Control detection', () => {
    it('should detect Control callsign', () => {
      expect(detectCallsign('Contact Control for update')).toBe('Control')
      expect(detectCallsign('Event Control requesting backup')).toBe('Control')
    })
  })

  describe('Confidence scoring', () => {
    it('should have high confidence for contextual matches', () => {
      const result = detectCallsignWithConfidence('reported by S1 at main gate')
      expect(result?.callsign).toBe('S1')
      expect(result?.confidence).toBeGreaterThan(0.9)
    })

    it('should have lower confidence for standalone matches', () => {
      const result = detectCallsignWithConfidence('S1 text here')
      expect(result?.callsign).toBe('S1')
      expect(result?.confidence).toBeLessThan(0.9)
    })
  })

  describe('Edge cases', () => {
    it('should handle callsigns with dashes', () => {
      expect(detectCallsign('S-1 on duty')).toBe('S1')
      expect(detectCallsign('A/2 responding')).toBe('A2')
    })

    it('should detect two-letter callsigns', () => {
      expect(detectCallsign('AB1 at scene')).toBe('AB1')
      expect(detectCallsign('XY12 responding')).toBe('XY12')
    })

    it('should return empty for no callsign', () => {
      expect(detectCallsign('No callsign in this text')).toBe('')
      expect(detectCallsign('')).toBe('')
    })
  })
})

describe('Optimized Incident Type Detection', () => {
  describe('Critical incidents', () => {
    it('should detect fire incidents', () => {
      expect(detectIncidentType('Fire in building 3')).toBe('Fire')
      expect(detectIncidentType('Flames visible in backstage area')).toBe('Fire')
    })

    it('should detect suspected fire', () => {
      expect(detectIncidentType('Smoke detected in equipment room')).toBe('Suspected Fire')
      expect(detectIncidentType('Burning smell in venue')).toBe('Suspected Fire')
    })

    it('should detect evacuation', () => {
      expect(detectIncidentType('Evacuation of main stage area')).toBe('Evacuation')
      expect(detectIncidentType('Need to evacuate crowd')).toBe('Evacuation')
    })

    it('should detect weapon-related incidents', () => {
      expect(detectIncidentType('Person with knife spotted')).toBe('Weapon Related')
      expect(detectIncidentType('Armed individual at gate')).toBe('Weapon Related')
    })
  })

  describe('Medical incidents', () => {
    it('should detect medical emergencies', () => {
      expect(detectIncidentType('Medical incident at main stage, person collapsed')).toBe('Medical')
      expect(detectIncidentType('First aid required at gate A')).toBe('Medical')
      expect(detectIncidentType('Person injured near stage')).toBe('Medical')
    })
  })

  describe('Security incidents', () => {
    it('should detect fights', () => {
      expect(detectIncidentType('Fight broke out in crowd')).toBe('Fight')
      expect(detectIncidentType('Physical altercation at bar')).toBe('Fight')
    })

    it('should detect theft', () => {
      expect(detectIncidentType('Theft reported at merchandise stand')).toBe('Theft')
      expect(detectIncidentType('Pickpocket in crowd')).toBe('Theft')
    })

    it('should detect ejections', () => {
      expect(detectIncidentType('Person ejected from venue')).toBe('Ejection')
      expect(detectIncidentType('Removed from site for disorderly conduct')).toBe('Ejection')
    })
  })

  describe('Crowd management', () => {
    it('should detect crowd issues', () => {
      expect(detectIncidentType('Crowd surge at barrier')).toBe('Crowd Management')
      expect(detectIncidentType('Dense crowd at main stage')).toBe('Crowd Management')
      expect(detectIncidentType('Queue management needed at gate')).toBe('Crowd Management')
    })
  })

  describe('Operational incidents', () => {
    it('should detect attendance', () => {
      expect(detectIncidentType('Current attendance is 5000')).toBe('Attendance')
      expect(detectIncidentType('Head count at 3500')).toBe('Attendance')
    })

    it('should detect sit reps', () => {
      expect(detectIncidentType('Situation report for control')).toBe('Sit Rep')
      expect(detectIncidentType('Status update from security')).toBe('Sit Rep')
    })
  })

  describe('Confidence scoring', () => {
    it('should provide high confidence for clear matches', () => {
      const result = detectIncidentTypeWithConfidence('Medical emergency, person collapsed')
      expect(result.type).toBe('Medical')
      expect(result.confidence).toBeGreaterThan(0.7)
    })

    it('should provide confidence scores for all matches', () => {
      const matches = getAllIncidentTypeMatches('Medical incident with crowd surge')
      expect(matches.length).toBeGreaterThan(1)
      expect(matches[0].type).toBe('Medical')
      expect(matches[0].confidence).toBeGreaterThan(0)
    })
  })

  describe('Alternative types', () => {
    it('should suggest alternatives for ambiguous text', () => {
      const alternatives = getAlternativeIncidentTypes('Person acting strangely near gate')
      expect(alternatives.length).toBeGreaterThan(0)
    })

    it('should provide Medical and Welfare as alternatives for injury', () => {
      const alternatives = getAlternativeIncidentTypes('Person hurt and distressed')
      expect(alternatives).toContain('Welfare')
    })
  })
})

describe('Optimized Priority Detection', () => {
  describe('Urgent priority', () => {
    it('should detect urgent from critical keywords', () => {
      expect(detectPriority('Life threatening injury')).toBe('urgent')
      expect(detectPriority('Person not breathing')).toBe('urgent')
      expect(detectPriority('Bomb threat at venue')).toBe('urgent')
    })

    it('should detect urgent from incident type', () => {
      expect(detectPriority('Fire outbreak', 'Fire')).toBe('urgent')
      expect(detectPriority('Evacuation needed', 'Evacuation')).toBe('urgent')
    })
  })

  describe('High priority', () => {
    it('should detect high from medical keywords', () => {
      expect(detectPriority('Medical emergency at gate')).toBe('high')
      expect(detectPriority('Person injured and bleeding')).toBe('high')
    })

    it('should detect high from security keywords', () => {
      expect(detectPriority('Fight in progress')).toBe('high')
      expect(detectPriority('Hostile person at entrance')).toBe('high')
    })

    it('should detect high from incident type', () => {
      expect(detectPriority('Medical assistance needed', 'Medical')).toBe('high')
    })
  })

  describe('Medium priority', () => {
    it('should detect medium from moderate keywords', () => {
      expect(detectPriority('Drunk person causing disturbance')).toBe('medium')
      expect(detectPriority('Theft reported at merchandise')).toBe('medium')
    })

    it('should detect medium from incident type', () => {
      expect(detectPriority('Person ejected', 'Ejection')).toBe('medium')
    })
  })

  describe('Low priority', () => {
    it('should detect low from informational keywords', () => {
      expect(detectPriority('Lost property at gate A')).toBe('low')
      expect(detectPriority('Attendance count is 4000')).toBe('low')
    })

    it('should detect low from incident type', () => {
      expect(detectPriority('Artist on stage', 'Artist On Stage')).toBe('low')
      expect(detectPriority('Timing update', 'Event Timing')).toBe('low')
    })

    it('should default to medium for ambiguous input', () => {
      expect(detectPriority('Something happening')).toBe('medium')
    })
  })

  describe('Confidence scoring and signals', () => {
    it('should provide detailed priority analysis', () => {
      const result = detectPriorityOptimized('Multiple people injured in crowd surge', 'Medical')
      expect(result.priority).toBe('high')
      expect(result.confidence).toBeGreaterThan(0.7)
      expect(result.signals.length).toBeGreaterThan(0)
      expect(result.reasoning).toContain('incident type')
    })

    it('should boost priority for quantity signals', () => {
      const single = detectPriorityOptimized('Person injured')
      const multiple = detectPriorityOptimized('15 people injured')
      expect(multiple.confidence).toBeGreaterThan(single.confidence)
    })

    it('should boost priority for temporal urgency', () => {
      const normal = detectPriorityOptimized('Medical incident')
      const urgent = detectPriorityOptimized('Medical incident, immediate response required')
      expect(urgent.confidence).toBeGreaterThan(normal.confidence)
    })
  })

  describe('Backward compatibility', () => {
    it('should work with just text', () => {
      const priority = detectPriority('Fire at venue')
      expect(['urgent', 'high', 'medium', 'low']).toContain(priority)
    })

    it('should work with text and incident type', () => {
      const priority = detectPriority('Incident at gate', 'Medical')
      expect(priority).toBe('high')
    })

    it('should provide confidence scores', () => {
      const result = detectPriorityWithConfidence('Emergency situation')
      expect(result.priority).toBeDefined()
      expect(result.confidence).toBeGreaterThan(0)
      expect(result.confidence).toBeLessThanOrEqual(1)
    })
  })
})

describe('Integration tests', () => {
  it('should detect callsign, type, and priority from full incident text', () => {
    const text = 'Medical incident at main stage, female collapsed and not breathing, reported by S1'
    
    const callsign = detectCallsign(text)
    const type = detectIncidentType(text)
    const priority = detectPriority(text, type)
    
    expect(callsign).toBe('S1')
    expect(type).toBe('Medical')
    expect(priority).toBe('urgent')
  })

  it('should handle complex security incident', () => {
    const text = 'Fight broke out near Bar 3, multiple people involved, Security 5 requesting backup'
    
    const callsign = detectCallsign(text)
    const type = detectIncidentType(text)
    const priority = detectPriority(text, type)
    
    expect(callsign).toBe('S5')
    expect(type).toBe('Fight')
    expect(priority).toBe('high')
  })

  it('should handle operational update', () => {
    const text = 'Situation report from Alpha 2: current attendance 3500, all quiet, artist on stage'
    
    const callsign = detectCallsign(text)
    const types = getAllIncidentTypeMatches(text)
    const priority = detectPriority(text)
    
    expect(callsign).toBe('A2')
    expect(types.some(t => t.type === 'Attendance' || t.type === 'Artist On Stage')).toBe(true)
    expect(priority).toBe('low')
  })
})

