import { NotificationTemplate } from '../types/settings'

// Template variable interface
export interface TemplateVariable {
  name: string
  description: string
  required: boolean
  defaultValue?: any
  validation?: (value: any) => boolean
}

// Template rendering result
export interface TemplateRenderResult {
  subject: string
  body: string
  variables: Record<string, any>
  missingVariables: string[]
  errors: string[]
}

// Template validation result
export interface TemplateValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  variables: TemplateVariable[]
}

// Common template variables
export const COMMON_VARIABLES: Record<string, TemplateVariable> = {
  user_name: {
    name: 'user_name',
    description: 'User\'s display name',
    required: false,
    defaultValue: 'User'
  },
  user_email: {
    name: 'user_email',
    description: 'User\'s email address',
    required: false
  },
  incident_type: {
    name: 'incident_type',
    description: 'Type of incident (e.g., Medical, Security, Technical)',
    required: true
  },
  incident_id: {
    name: 'incident_id',
    description: 'Unique incident identifier',
    required: true
  },
  venue_name: {
    name: 'venue_name',
    description: 'Name of the venue or location',
    required: false,
    defaultValue: 'Event Venue'
  },
  location: {
    name: 'location',
    description: 'Specific location within the venue',
    required: false
  },
  priority: {
    name: 'priority',
    description: 'Incident priority level',
    required: false,
    defaultValue: 'Medium',
    validation: (value) => ['Low', 'Medium', 'High', 'Critical'].includes(value)
  },
  date: {
    name: 'date',
    description: 'Current date or incident date',
    required: false,
    defaultValue: () => new Date().toLocaleDateString()
  },
  time: {
    name: 'time',
    description: 'Current time or incident time',
    required: false,
    defaultValue: () => new Date().toLocaleTimeString()
  },
  total_incidents: {
    name: 'total_incidents',
    description: 'Total number of incidents',
    required: false,
    defaultValue: '0',
    validation: (value) => !isNaN(Number(value))
  },
  resolved_incidents: {
    name: 'resolved_incidents',
    description: 'Number of resolved incidents',
    required: false,
    defaultValue: '0',
    validation: (value) => !isNaN(Number(value))
  },
  pending_incidents: {
    name: 'pending_incidents',
    description: 'Number of pending incidents',
    required: false,
    defaultValue: '0',
    validation: (value) => !isNaN(Number(value))
  },
  start_time: {
    name: 'start_time',
    description: 'Start time for scheduled events',
    required: false
  },
  end_time: {
    name: 'end_time',
    description: 'End time for scheduled events',
    required: false
  },
  reason: {
    name: 'reason',
    description: 'Reason for the notification',
    required: false
  }
}

/**
 * Extract variables from template text
 */
export function extractVariables(template: string): string[] {
  const regex = /{{([^}]+)}}/g
  const variables: string[] = []
  let match
  
  while ((match = regex.exec(template)) !== null) {
    const variableName = match[1].trim()
    if (!variables.includes(variableName)) {
      variables.push(variableName)
    }
  }
  
  return variables
}

/**
 * Validate template content
 */
export function validateTemplate(template: NotificationTemplate): TemplateValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const variables: TemplateVariable[] = []
  
  // Size limits (subject <= 200 chars, body <= 5000 chars)
  if (template.subject && template.subject.length > 200) {
    errors.push('Subject exceeds maximum length of 200 characters')
  }
  if (template.body && template.body.length > 5000) {
    errors.push('Body exceeds maximum length of 5000 characters')
  }
  
  // Check required fields
  if (!template.template_name?.trim()) {
    errors.push('Template name is required')
  }
  
  if (!template.subject?.trim()) {
    errors.push('Subject is required')
  }
  
  if (!template.body?.trim()) {
    errors.push('Body is required')
  }
  
  // Check for HTML injection attempts
  const htmlPattern = /<[^>]*>/g
  if (htmlPattern.test(template.subject) || htmlPattern.test(template.body)) {
    warnings.push('HTML tags detected in template content')
  }
  
  // Extract and validate variables
  const subjectVariables = extractVariables(template.subject)
  const bodyVariables = extractVariables(template.body)
  const allVariables = [...new Set([...subjectVariables, ...bodyVariables])]
  
  for (const variableName of allVariables) {
    // Variable naming convention: lowercase letters, numbers and underscores only
    if (!/^[a-z0-9_]+$/.test(variableName)) {
      errors.push(`Invalid variable name '${variableName}'. Use lowercase letters, numbers, and underscores only`)
      continue
    }
    const commonVariable = COMMON_VARIABLES[variableName]
    
    if (commonVariable) {
      variables.push(commonVariable)
    } else {
      // Custom variable
      variables.push({
        name: variableName,
        description: `Custom variable: ${variableName}`,
        required: false
      })
      warnings.push(`Unknown variable: ${variableName}`)
    }
  }
  
  // Check for required variables
  const requiredVariables = variables.filter(v => v.required)
  for (const requiredVar of requiredVariables) {
    if (!template.variables.includes(requiredVar.name)) {
      errors.push(`Required variable '${requiredVar.name}' is missing from template variables list`)
    }
  }

  // Security checks: prohibit dangerous patterns like script tags and url protocols in variables
  const dangerousPattern = /(javascript:|data:|vbscript:)/i
  if (dangerousPattern.test(template.subject) || dangerousPattern.test(template.body)) {
    warnings.push('Potentially dangerous protocol detected in template content')
  }
  const scriptTagPattern = /<\s*script\b[^>]*>([\s\S]*?)<\s*\/\s*script>/i
  if (scriptTagPattern.test(template.subject) || scriptTagPattern.test(template.body)) {
    errors.push('Script tags are not allowed in templates')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    variables
  }
}

/**
 * Render template with provided variables
 */
export function renderTemplate(
  template: NotificationTemplate,
  variables: Record<string, any>
): TemplateRenderResult {
  const result: TemplateRenderResult = {
    subject: template.subject,
    body: template.body,
    variables: { ...variables },
    missingVariables: [],
    errors: []
  }
  
  // Extract all variables from template
  const subjectVariables = extractVariables(template.subject)
  const bodyVariables = extractVariables(template.body)
  const allVariables = [...new Set([...subjectVariables, ...bodyVariables])]
  
  // Check for missing variables
  for (const variableName of allVariables) {
    if (!(variableName in variables)) {
      result.missingVariables.push(variableName)
      
      // Use default value if available
      const commonVariable = COMMON_VARIABLES[variableName]
      if (commonVariable?.defaultValue) {
        const defaultValue = typeof commonVariable.defaultValue === 'function' 
          ? commonVariable.defaultValue() 
          : commonVariable.defaultValue
        result.variables[variableName] = defaultValue
      }
    }
  }
  
  // Validate variable values
  for (const [variableName, value] of Object.entries(result.variables)) {
    const commonVariable = COMMON_VARIABLES[variableName]
    if (commonVariable?.validation && !commonVariable.validation(value)) {
      result.errors.push(`Invalid value for variable '${variableName}': ${value}`)
    }
  }
  
  // Render subject
  result.subject = renderText(template.subject, result.variables)
  
  // Render body
  result.body = renderText(template.body, result.variables)
  
  return result
}

/**
 * Render text with variable substitution
 */
function renderText(text: string, variables: Record<string, any>): string {
  let rendered = text
  
  // Replace variables with values
  for (const [variableName, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${variableName}}}`, 'g')
    rendered = rendered.replace(regex, String(value || ''))
  }
  
  // Clean up any remaining variable placeholders
  rendered = rendered.replace(/{{[^}]+}}/g, '[MISSING_VARIABLE]')
  
  return rendered
}

/**
 * Sanitize template content to prevent injection attacks
 */
export function sanitizeTemplate(template: string): string {
  // Remove HTML tags
  let sanitized = template.replace(/<[^>]*>/g, '')
  
  // Escape special characters
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
  
  return sanitized
}

/**
 * Test template with sample data
 */
export function testTemplate(
  template: NotificationTemplate,
  sampleData: Record<string, any> = {}
): TemplateRenderResult {
  // Generate sample data for missing variables
  const testVariables = { ...sampleData }
  
  const allVariables = [
    ...extractVariables(template.subject),
    ...extractVariables(template.body)
  ]
  
  for (const variableName of allVariables) {
    if (!(variableName in testVariables)) {
      const commonVariable = COMMON_VARIABLES[variableName]
      if (commonVariable?.defaultValue) {
        testVariables[variableName] = typeof commonVariable.defaultValue === 'function'
          ? commonVariable.defaultValue()
          : commonVariable.defaultValue
      } else {
        testVariables[variableName] = `[SAMPLE_${variableName.toUpperCase()}]`
      }
    }
  }
  
  return renderTemplate(template, testVariables)
}

/**
 * Get template preview with sample data
 */
export function getTemplatePreview(template: NotificationTemplate): {
  subject: string
  body: string
  sampleData: Record<string, any>
} {
  const sampleData: Record<string, any> = {
    user_name: 'John Doe',
    user_email: 'john.doe@example.com',
    incident_type: 'Medical Emergency',
    incident_id: 'INC-2024-001',
    venue_name: 'Main Stadium',
    location: 'Section A, Row 15',
    priority: 'High',
    date: new Date().toLocaleDateString(),
    time: new Date().toLocaleTimeString(),
    total_incidents: '5',
    resolved_incidents: '3',
    pending_incidents: '2',
    start_time: '10:00 PM',
    end_time: '12:00 AM',
    reason: 'System maintenance and updates'
  }
  
  const result = renderTemplate(template, sampleData)
  
  return {
    subject: result.subject,
    body: result.body,
    sampleData
  }
}

/**
 * Cache template for performance
 */
const templateCache = new Map<string, { template: NotificationTemplate; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export function cacheTemplate(template: NotificationTemplate): void {
  templateCache.set(template.id, {
    template,
    timestamp: Date.now()
  })
}

export function getCachedTemplate(templateId: string): NotificationTemplate | null {
  const cached = templateCache.get(templateId)
  if (!cached) return null
  
  // Check if cache is still valid
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    templateCache.delete(templateId)
    return null
  }
  
  return cached.template
}

export function clearTemplateCache(): void {
  templateCache.clear()
}

/**
 * Get template statistics
 */
export function getTemplateStats(template: NotificationTemplate): {
  variableCount: number
  subjectLength: number
  bodyLength: number
  complexity: 'low' | 'medium' | 'high'
} {
  const variables = extractVariables(template.subject + ' ' + template.body)
  const subjectLength = template.subject.length
  const bodyLength = template.body.length
  
  // Calculate complexity based on variables and length
  let complexity: 'low' | 'medium' | 'high' = 'low'
  const totalLength = subjectLength + bodyLength
  
  if (variables.length > 5 || totalLength > 500) {
    complexity = 'high'
  } else if (variables.length > 2 || totalLength > 200) {
    complexity = 'medium'
  }
  
  return {
    variableCount: variables.length,
    subjectLength,
    bodyLength,
    complexity
  }
}

/**
 * Generate template suggestions based on category
 */
export function getTemplateSuggestions(category: string): {
  subject: string
  body: string
  variables: string[]
} {
  const suggestions: Record<string, { subject: string; body: string; variables: string[] }> = {
    incident: {
      subject: 'New {{incident_type}} Incident - {{incident_id}}',
      body: `A new {{incident_type}} incident has been reported at {{venue_name}}.

Incident ID: {{incident_id}}
Location: {{location}}
Priority: {{priority}}

Please review and take appropriate action.`,
      variables: ['incident_type', 'incident_id', 'venue_name', 'location', 'priority']
    },
    system: {
      subject: 'System {{reason}} - {{date}}',
      body: `System maintenance notice:

{{reason}}

Duration: {{start_time}} - {{end_time}}
Date: {{date}}

We apologize for any inconvenience.`,
      variables: ['reason', 'start_time', 'end_time', 'date']
    },
    user: {
      subject: 'Daily Report - {{date}}',
      body: `Hello {{user_name}},

Here is your daily activity summary for {{date}}:

- Total Incidents: {{total_incidents}}
- Resolved: {{resolved_incidents}}
- Pending: {{pending_incidents}}

Thank you for your service.`,
      variables: ['user_name', 'date', 'total_incidents', 'resolved_incidents', 'pending_incidents']
    },
    general: {
      subject: 'Notification - {{reason}}',
      body: `Hello {{user_name}},

{{reason}}

If you have any questions, please contact support.

Best regards,
The Team`,
      variables: ['user_name', 'reason']
    }
  }
  
  return suggestions[category] || suggestions.general
}

// --- Template Versioning Support ---

export interface TemplateVersionHistoryEntry {
  id: string
  template_id: string
  version: number
  subject: string
  body: string
  variables: string[]
  created_at: string
  created_by?: string
}

/**
 * Create a new template version by incrementing version and saving historical entry
 */
export async function createNewTemplateVersion(
  supabase: any,
  templateId: string,
  updates: Partial<Pick<NotificationTemplate, 'subject' | 'body' | 'variables' | 'is_active'>>,
  userId?: string
): Promise<{ success: boolean; error?: string; newVersion?: number }>{
  try {
    const { data: existing, error: fetchError } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('id', templateId)
      .single()
    if (fetchError || !existing) {
      return { success: false, error: fetchError?.message || 'Template not found' }
    }

    // Save current state to history table if present
    const hasHistory = await ensureTemplateHistoryTable(supabase)
    if (hasHistory) {
      await supabase.from('notification_template_history').insert({
        template_id: existing.id,
        version: existing.version,
        subject: existing.subject,
        body: existing.body,
        variables: existing.variables,
        created_by: userId || existing.created_by || null
      })
    }

    const newVersion = (existing.version || 1) + 1
    const { error: updateError } = await supabase
      .from('notification_templates')
      .update({
        subject: updates.subject ?? existing.subject,
        body: updates.body ?? existing.body,
        variables: updates.variables ?? existing.variables,
        is_active: updates.is_active ?? existing.is_active,
        version: newVersion,
        updated_at: new Date().toISOString()
      })
      .eq('id', templateId)

    if (updateError) return { success: false, error: updateError.message }
    return { success: true, newVersion }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Roll back a template to a specific previous version
 */
export async function rollbackTemplateVersion(
  supabase: any,
  templateId: string,
  version: number
): Promise<{ success: boolean; error?: string }>{
  try {
    const hasHistory = await ensureTemplateHistoryTable(supabase)
    if (!hasHistory) return { success: false, error: 'Template history not supported' }

    const { data: entry, error } = await supabase
      .from('notification_template_history')
      .select('*')
      .eq('template_id', templateId)
      .eq('version', version)
      .single()
    if (error || !entry) return { success: false, error: error?.message || 'Version not found' }

    const { error: updateError } = await supabase
      .from('notification_templates')
      .update({
        subject: entry.subject,
        body: entry.body,
        variables: entry.variables,
        version: version,
        updated_at: new Date().toISOString()
      })
      .eq('id', templateId)
    if (updateError) return { success: false, error: updateError.message }
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Get version history for a template
 */
export async function getTemplateHistory(
  supabase: any,
  templateId: string
): Promise<{ success: boolean; error?: string; history?: TemplateVersionHistoryEntry[] }>{
  try {
    const hasHistory = await ensureTemplateHistoryTable(supabase)
    if (!hasHistory) return { success: true, history: [] }
    const { data, error } = await supabase
      .from('notification_template_history')
      .select('*')
      .eq('template_id', templateId)
      .order('version', { ascending: false })
    if (error) return { success: false, error: error.message }
    return { success: true, history: data || [] }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Ensure history table exists (no-op if not present)
async function ensureTemplateHistoryTable(supabase: any): Promise<boolean> {
  try {
    // Attempt a lightweight select; if it fails due to missing table, return false
    const { error } = await supabase
      .from('notification_template_history')
      .select('template_id')
      .limit(1)
    if (error && (error as any).code === '42P01') {
      // table does not exist
      return false
    }
    return true
  } catch {
    return false
  }
}
