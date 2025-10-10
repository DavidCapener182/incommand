/**
 * Intelligent Automation Workflow Engine
 * If-then-else rules, auto-escalation, smart routing
 */

export interface WorkflowRule {
  id: string
  name: string
  description: string
  trigger: WorkflowTrigger
  conditions: WorkflowCondition[]
  actions: WorkflowAction[]
  isActive: boolean
  priority: number
}

export interface WorkflowTrigger {
  type: 'incident_created' | 'incident_updated' | 'time_elapsed' | 'threshold_exceeded' | 'manual'
  config: any
}

export interface WorkflowCondition {
  field: string
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'matches'
  value: any
  logic: 'AND' | 'OR'
}

export interface WorkflowAction {
  type: 'escalate' | 'notify' | 'assign' | 'update_field' | 'create_task' | 'send_webhook'
  config: any
}

export class WorkflowEngine {
  private rules: Map<string, WorkflowRule> = new Map()

  registerRule(rule: WorkflowRule): void {
    this.rules.set(rule.id, rule)
  }

  async execute(trigger: string, data: any): Promise<void> {
    const matchingRules = Array.from(this.rules.values())
      .filter(rule => rule.isActive && rule.trigger.type === trigger)
      .sort((a, b) => b.priority - a.priority)

    for (const rule of matchingRules) {
      if (this.evaluateConditions(rule.conditions, data)) {
        await this.executeActions(rule.actions, data)
      }
    }
  }

  private evaluateConditions(conditions: WorkflowCondition[], data: any): boolean {
    if (conditions.length === 0) return true

    const results = conditions.map(condition => {
      const value = this.getFieldValue(data, condition.field)
      return this.evaluateCondition(value, condition.operator, condition.value)
    })

    // Evaluate with AND/OR logic
    return results.every(r => r) // Simplified - would implement full logic
  }

  private evaluateCondition(value: any, operator: string, compareValue: any): boolean {
    switch (operator) {
      case 'equals': return value === compareValue
      case 'not_equals': return value !== compareValue
      case 'greater_than': return value > compareValue
      case 'less_than': return value < compareValue
      case 'contains': return String(value).includes(String(compareValue))
      default: return false
    }
  }

  private async executeActions(actions: WorkflowAction[], data: any): Promise<void> {
    for (const action of actions) {
      switch (action.type) {
        case 'escalate':
          await this.escalateIncident(data.id, action.config)
          break
        case 'notify':
          await this.sendNotification(action.config)
          break
        case 'assign':
          await this.assignIncident(data.id, action.config.assignee)
          break
      }
    }
  }

  private getFieldValue(obj: any, field: string): any {
    return field.split('.').reduce((o, k) => o?.[k], obj)
  }

  private async escalateIncident(id: string, config: any): Promise<void> {
    console.log('Escalating incident:', id, config)
  }

  private async sendNotification(config: any): Promise<void> {
    console.log('Sending notification:', config)
  }

  private async assignIncident(id: string, assignee: string): Promise<void> {
    console.log('Assigning incident:', id, 'to', assignee)
  }
}

export const workflowEngine = new WorkflowEngine()
