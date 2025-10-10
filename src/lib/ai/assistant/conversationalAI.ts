/**
 * Advanced AI Assistant
 * ChatGPT-style conversational interface for command operations
 */

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  context?: any
}

export interface AICommand {
  intent: string
  entities: Record<string, any>
  confidence: number
  suggestedAction?: string
}

export class ConversationalAI {
  private conversationHistory: ChatMessage[] = []

  async chat(userMessage: string, context?: any): Promise<ChatMessage> {
    // Add user message to history
    this.conversationHistory.push({
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
      context
    })

    // Parse intent and entities
    const command = this.parseCommand(userMessage)

    // Generate response
    const response = await this.generateResponse(command, context)

    // Add assistant response to history
    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response,
      timestamp: new Date().toISOString()
    }

    this.conversationHistory.push(assistantMessage)

    return assistantMessage
  }

  private parseCommand(message: string): AICommand {
    const lower = message.toLowerCase()

    // Detect intents
    if (lower.includes('create') || lower.includes('log') || lower.includes('report')) {
      return {
        intent: 'create_incident',
        entities: this.extractIncidentEntities(message),
        confidence: 0.9,
        suggestedAction: 'Open incident creation form'
      }
    }

    if (lower.includes('search') || lower.includes('find') || lower.includes('show')) {
      return {
        intent: 'search',
        entities: { query: message },
        confidence: 0.85,
        suggestedAction: 'Perform semantic search'
      }
    }

    if (lower.includes('analytics') || lower.includes('stats') || lower.includes('report')) {
      return {
        intent: 'view_analytics',
        entities: {},
        confidence: 0.8,
        suggestedAction: 'Navigate to analytics'
      }
    }

    return {
      intent: 'unknown',
      entities: {},
      confidence: 0.3
    }
  }

  private extractIncidentEntities(message: string): any {
    return {
      type: this.extractIncidentType(message),
      priority: this.extractPriority(message),
      location: this.extractLocation(message)
    }
  }

  private extractIncidentType(message: string): string | undefined {
    const types = ['medical', 'fire', 'theft', 'assault', 'ejection']
    for (const type of types) {
      if (message.toLowerCase().includes(type)) {
        return type.charAt(0).toUpperCase() + type.slice(1)
      }
    }
    return undefined
  }

  private extractPriority(message: string): string | undefined {
    const lower = message.toLowerCase()
    if (lower.includes('urgent') || lower.includes('emergency') || lower.includes('critical')) return 'high'
    if (lower.includes('low') || lower.includes('minor')) return 'low'
    return 'medium'
  }

  private extractLocation(message: string): string | undefined {
    const match = message.match(/(?:at|in|near)\s+([^,.]+)/i)
    return match?.[1]?.trim()
  }

  private async generateResponse(command: AICommand, context?: any): Promise<string> {
    switch (command.intent) {
      case 'create_incident':
        return this.generateIncidentCreationResponse(command.entities)
      case 'search':
        return 'I\'ll search for that information. What specific details are you looking for?'
      case 'view_analytics':
        return 'I can show you analytics. Would you like operational, quality, or compliance metrics?'
      default:
        return 'I\'m here to help. You can ask me to create incidents, search logs, view analytics, or manage staff.'
    }
  }

  private generateIncidentCreationResponse(entities: any): string {
    let response = 'I\'ll help you create an incident. '
    
    if (entities.type) response += `Type: ${entities.type}. `
    if (entities.priority) response += `Priority: ${entities.priority}. `
    if (entities.location) response += `Location: ${entities.location}. `
    
    response += 'What additional details should I include?'
    
    return response
  }

  getConversationHistory(): ChatMessage[] {
    return this.conversationHistory
  }

  clearHistory(): void {
    this.conversationHistory = []
  }
}

export const conversationalAI = new ConversationalAI()
