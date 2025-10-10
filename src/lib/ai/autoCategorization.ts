/**
 * Auto-Categorization System
 * ML-based incident classification and tagging
 */

export interface ClassificationResult {
  incidentType: string
  confidence: number
  alternativeTypes: Array<{ type: string; confidence: number }>
  suggestedPriority: 'high' | 'medium' | 'low'
  suggestedTags: string[]
  reasoning: string[]
}

export interface AutoTagResult {
  tags: string[]
  confidence: number
  categories: string[]
}

export class AutoCategorization {
  private incidentPatterns: Map<string, RegExp[]> = new Map()
  private priorityKeywords: Map<string, string[]> = new Map()
  private tagDatabase: Map<string, string[]> = new Map()

  constructor() {
    this.initializePatterns()
  }

  /**
   * Classify incident based on description
   */
  classify(description: string, context?: any): ClassificationResult {
    const descriptionLower = description.toLowerCase()
    const words = this.tokenize(descriptionLower)

    // Calculate scores for each incident type
    const scores = new Map<string, number>()
    
    for (const [type, patterns] of this.incidentPatterns) {
      let score = 0
      
      for (const pattern of patterns) {
        if (pattern.test(descriptionLower)) {
          score += 1
        }
      }

      // Boost score for exact word matches
      const typeWords = type.toLowerCase().split(' ')
      const matchingWords = typeWords.filter(word => words.includes(word)).length
      score += matchingWords * 0.5

      if (score > 0) {
        scores.set(type, score)
      }
    }

    // Sort by score
    const sortedTypes = Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])

    if (sortedTypes.length === 0) {
      return {
        incidentType: 'Other',
        confidence: 0.3,
        alternativeTypes: [],
        suggestedPriority: 'medium',
        suggestedTags: [],
        reasoning: ['No clear pattern match - defaulting to "Other"']
      }
    }

    const [topType, topScore] = sortedTypes[0]
    const totalScore = Array.from(scores.values()).reduce((sum, s) => sum + s, 0)
    const confidence = totalScore > 0 ? topScore / totalScore : 0

    // Get alternative types
    const alternativeTypes = sortedTypes.slice(1, 4).map(([type, score]) => ({
      type,
      confidence: totalScore > 0 ? score / totalScore : 0
    }))

    // Determine priority
    const suggestedPriority = this.determinePriority(descriptionLower, topType)

    // Generate tags
    const suggestedTags = this.generateTags(descriptionLower, topType)

    // Generate reasoning
    const reasoning = this.generateReasoning(topType, descriptionLower, confidence)

    return {
      incidentType: topType,
      confidence,
      alternativeTypes,
      suggestedPriority,
      suggestedTags,
      reasoning
    }
  }

  /**
   * Auto-tag incident
   */
  autoTag(description: string, incidentType?: string): AutoTagResult {
    const descriptionLower = description.toLowerCase()
    const tags: Set<string> = new Set()
    const categories: Set<string> = new Set()

    // Add type-based tags
    if (incidentType) {
      const typeTags = this.tagDatabase.get(incidentType) || []
      typeTags.forEach(tag => tags.add(tag))
    }

    // Extract contextual tags
    const contextTags = this.extractContextualTags(descriptionLower)
    contextTags.forEach(tag => tags.add(tag))

    // Categorize
    if (descriptionLower.match(/medical|health|injury|ambulance/)) {
      categories.add('Health & Safety')
    }
    if (descriptionLower.match(/security|suspicious|threat|danger/)) {
      categories.add('Security')
    }
    if (descriptionLower.match(/crowd|surge|capacity|overcrowd/)) {
      categories.add('Crowd Management')
    }
    if (descriptionLower.match(/fire|smoke|evacuation|alarm/)) {
      categories.add('Emergency Response')
    }

    const confidence = tags.size > 0 ? Math.min(1.0, tags.size / 5) : 0.5

    return {
      tags: Array.from(tags),
      confidence,
      categories: Array.from(categories)
    }
  }

  /**
   * Batch classify multiple incidents
   */
  async batchClassify(incidents: Array<{ description: string; id: string }>): Promise<Map<string, ClassificationResult>> {
    const results = new Map<string, ClassificationResult>()

    for (const incident of incidents) {
      const classification = this.classify(incident.description)
      results.set(incident.id, classification)
    }

    return results
  }

  /**
   * Train on user corrections (future enhancement)
   */
  learn(description: string, correctType: string, userConfirmedPriority: string): void {
    // This would update the model based on user corrections
    // For now, we'll just log it
    console.log('Learning from correction:', { description, correctType, userConfirmedPriority })
    
    // In production, this would:
    // 1. Store the correction in a database
    // 2. Periodically retrain the model
    // 3. Adjust pattern weights
  }

  // Private helper methods

  private initializePatterns(): void {
    // Medical patterns
    this.incidentPatterns.set('Medical', [
      /medical|medic|ambulance|paramedic/i,
      /injury|injured|hurt|pain/i,
      /collapse|faint|unconscious|unresponsive/i,
      /seizure|fit|convuls/i,
      /breathing|respiratory|asthma/i,
      /chest pain|heart|cardiac/i,
      /bleed|blood|cut|wound/i,
      /fracture|broken|sprain/i,
      /overdose|intoxicat|drunk|alcohol/i
    ])

    // Ejection patterns
    this.incidentPatterns.set('Ejection', [
      /eject|remov|escort.*out|escort.*off/i,
      /banned|barred|prohibited/i,
      /refuse.*entry.*afterremov|denied.*reentry/i
    ])

    // Refusal patterns
    this.incidentPatterns.set('Refusal of Entry', [
      /refus.*entry|refused.*admission|denied.*entry/i,
      /not.*allow|cannot.*enter|barred.*entry/i,
      /ticket.*invalid|no.*ticket/i,
      /intoxicated.*entry|too.*drunk/i
    ])

    // Theft patterns
    this.incidentPatterns.set('Theft', [
      /theft|steal|stolen|stole/i,
      /pickpocket|wallet.*missing|purse.*missing/i,
      /robbery|robbed|burgl/i,
      /shoplifting|merchandise.*stolen/i
    ])

    // Fire patterns
    this.incidentPatterns.set('Fire', [
      /fire|flame|burning|smoke/i,
      /fire alarm|smoke alarm|fire.*detect/i,
      /evacuat/i,
      /extinguish/i
    ])

    // Suspicious Behaviour patterns
    this.incidentPatterns.set('Suspicious Behaviour', [
      /suspicious|concern|worried|unusual/i,
      /unattended.*bag|abandoned.*package/i,
      /loiter|lurk|watching/i,
      /unauthorized|trespass/i
    ])

    // Crowd patterns
    this.incidentPatterns.set('Crowd Control', [
      /crowd|surge|crush|capacity/i,
      /overcrowd|too.*many.*people/i,
      /bottleneck|congestion/i,
      /pushing|shoving/i
    ])

    // Lost Person patterns
    this.incidentPatterns.set('Lost Person', [
      /lost.*child|missing.*child|separated.*child/i,
      /lost.*person|missing.*person/i,
      /cannot.*find|looking.*for/i,
      /reunite|reunion/i
    ])

    // Priority keywords
    this.priorityKeywords.set('high', [
      'emergency', 'urgent', 'critical', 'immediate', 'life-threatening',
      'unconscious', 'not breathing', 'chest pain', 'bleeding heavily',
      'fire', 'evacuation', 'weapon', 'assault', 'attack'
    ])

    this.priorityKeywords.set('medium', [
      'injury', 'medical', 'fight', 'altercation', 'theft',
      'suspicious', 'concern', 'ejection', 'refusal'
    ])

    this.priorityKeywords.set('low', [
      'lost property', 'noise', 'complaint', 'query', 'information'
    ])

    // Tag database
    this.tagDatabase.set('Medical', ['health', 'first-aid', 'medical-response'])
    this.tagDatabase.set('Fire', ['emergency', 'evacuation', 'fire-safety'])
    this.tagDatabase.set('Theft', ['security', 'crime', 'property'])
    this.tagDatabase.set('Ejection', ['security', 'crowd-management', 'behavior'])
    this.tagDatabase.set('Suspicious Behaviour', ['security', 'surveillance', 'threat-assessment'])
  }

  private determinePriority(description: string, incidentType: string): 'high' | 'medium' | 'low' {
    // Check for high priority keywords
    const highKeywords = this.priorityKeywords.get('high') || []
    if (highKeywords.some(keyword => description.includes(keyword))) {
      return 'high'
    }

    // Certain incident types are inherently high priority
    if (['Fire', 'Medical', 'Assault'].includes(incidentType)) {
      return 'high'
    }

    // Check for low priority keywords
    const lowKeywords = this.priorityKeywords.get('low') || []
    if (lowKeywords.some(keyword => description.includes(keyword))) {
      return 'low'
    }

    return 'medium'
  }

  private generateTags(description: string, incidentType: string): string[] {
    const tags = this.autoTag(description, incidentType)
    return tags.tags
  }

  private extractContextualTags(description: string): string[] {
    const tags: string[] = []

    // Location tags
    if (description.match(/gate|entrance|exit/)) tags.push('entry-point')
    if (description.match(/stage|backstage|arena/)) tags.push('venue-area')
    if (description.match(/toilet|bathroom|restroom/)) tags.push('facilities')
    if (description.match(/bar|concession|merchandise/)) tags.push('commercial')

    // Time tags
    if (description.match(/opening|start|beginning/)) tags.push('event-start')
    if (description.match(/closing|end|finish/)) tags.push('event-end')

    // Response tags
    if (description.match(/police|law enforcement/)) tags.push('police-involved')
    if (description.match(/ambulance|hospital/)) tags.push('ambulance-called')
    if (description.match(/first aid/)) tags.push('first-aid-rendered')

    return tags
  }

  private generateReasoning(type: string, description: string, confidence: number): string[] {
    const reasoning: string[] = []

    reasoning.push(`Classified as "${type}" with ${(confidence * 100).toFixed(0)}% confidence`)

    const patterns = this.incidentPatterns.get(type) || []
    const matchingPatterns = patterns.filter(pattern => pattern.test(description))
    
    if (matchingPatterns.length > 0) {
      reasoning.push(`Matched ${matchingPatterns.length} pattern(s) for ${type}`)
    }

    if (confidence > 0.8) {
      reasoning.push('High confidence - strong pattern match')
    } else if (confidence < 0.5) {
      reasoning.push('Low confidence - consider manual review')
    }

    return reasoning
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2)
  }
}

// Export singleton instance
export const autoCategorization = new AutoCategorization()
