import { z } from 'zod'
import { logger } from './logger'

// Common validation schemas
export const commonSchemas = {
  // UUID validation
  uuid: z.string().uuid('Invalid UUID format'),
  
  // Email validation
  email: z.string().email('Invalid email format'),
  
  // Password validation (minimum 8 characters, at least one letter and one number)
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[A-Za-z])(?=.*\d)/, 'Password must contain at least one letter and one number'),
  
  // Phone number validation
  phoneNumber: z.string()
    .regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format'),
  
  // URL validation
  url: z.string().url('Invalid URL format'),
  
  // Date validation
  date: z.string().datetime('Invalid date format'),
  
  // Positive integer validation
  positiveInt: z.number().int().positive('Must be a positive integer'),
  
  // Non-negative integer validation
  nonNegativeInt: z.number().int().nonnegative('Must be a non-negative integer'),
  
  // Query parameters
  queryParams: z.object({
    eventId: z.string().uuid('Invalid event ID').optional(),
    incidentId: z.string().uuid('Invalid incident ID').optional(),
  }),
  
  // Delete parameters
  deleteParams: z.object({
    incidentId: z.string().uuid('Invalid incident ID').optional(),
    staffId: z.string().uuid('Invalid staff ID').optional(),
  }),
}

// Incident-related schemas
export const incidentSchemas = {
  // Create incident
  createIncident: z.object({
    eventId: commonSchemas.uuid,
    incidentType: z.string().min(1, 'Incident type is required').max(100),
    description: z.string().min(1, 'Description is required').max(1000),
    location: z.string().max(200).optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
    callsign: z.string().max(50).optional(),
    assignedStaffIds: z.array(commonSchemas.uuid).optional(),
    coordinates: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180)
    }).optional(),
  }),
  
  // Update incident
  updateIncident: z.object({
    id: commonSchemas.uuid,
    incidentType: z.string().min(1).max(100).optional(),
    description: z.string().min(1).max(1000).optional(),
    location: z.string().max(200).optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    status: z.enum(['open', 'in-progress', 'closed', 'escalated']).optional(),
    assignedStaffIds: z.array(commonSchemas.uuid).optional(),
    coordinates: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180)
    }).optional(),
  }),
  
  // Incident filters
  incidentFilters: z.object({
    types: z.array(z.string()).optional(),
    statuses: z.array(z.string()).optional(),
    priorities: z.array(z.string()).optional(),
    query: z.string().max(200).optional(),
    startDate: commonSchemas.date.optional(),
    endDate: commonSchemas.date.optional(),
    assignedTo: commonSchemas.uuid.optional(),
  }),
}

// User-related schemas
export const userSchemas = {
  // Create user
  createUser: z.object({
    email: commonSchemas.email,
    password: commonSchemas.password,
    fullName: z.string().min(1, 'Full name is required').max(100),
    role: z.enum(['user', 'admin', 'superadmin']).default('user'),
    companyId: commonSchemas.uuid.optional(),
  }),
  
  // Update user
  updateUser: z.object({
    id: commonSchemas.uuid,
    email: commonSchemas.email.optional(),
    fullName: z.string().min(1).max(100).optional(),
    role: z.enum(['user', 'admin', 'superadmin']).optional(),
    active: z.boolean().optional(),
  }),
  
  // User preferences
  userPreferences: z.object({
    theme: z.enum(['light', 'dark', 'system']).default('system'),
    notifications: z.object({
      email: z.boolean().default(true),
      push: z.boolean().default(true),
      sms: z.boolean().default(false),
    }).optional(),
    dashboardLayout: z.record(z.any()).optional(),
  }),
}

// Event-related schemas
export const eventSchemas = {
  // Create event
  createEvent: z.object({
    eventName: z.string().min(1, 'Event name is required').max(200),
    eventType: z.string().min(1, 'Event type is required').max(100),
    eventDate: commonSchemas.date,
    venue: z.string().max(200).optional(),
    description: z.string().max(1000).optional(),
    expectedAttendance: commonSchemas.nonNegativeInt.optional(),
    coordinates: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180)
    }).optional(),
  }),
  
  // Update event
  updateEvent: z.object({
    id: commonSchemas.uuid,
    eventName: z.string().min(1).max(200).optional(),
    eventType: z.string().min(1).max(100).optional(),
    eventDate: commonSchemas.date.optional(),
    venue: z.string().max(200).optional(),
    description: z.string().max(1000).optional(),
    expectedAttendance: commonSchemas.nonNegativeInt.optional(),
    isCurrent: z.boolean().optional(),
  }),
}

// Staff-related schemas
export const staffSchemas = {
  // Create staff member
  createStaff: z.object({
    fullName: z.string().min(1, 'Full name is required').max(100),
    email: commonSchemas.email.optional(),
    contactNumber: commonSchemas.phoneNumber.optional(),
    skillTags: z.array(z.string().max(50)).optional(),
    notes: z.string().max(500).optional(),
    companyId: commonSchemas.uuid,
  }),
  
  // Update staff member
  updateStaff: z.object({
    id: commonSchemas.uuid,
    fullName: z.string().min(1).max(100).optional(),
    email: commonSchemas.email.optional(),
    contactNumber: commonSchemas.phoneNumber.optional(),
    skillTags: z.array(z.string().max(50)).optional(),
    notes: z.string().max(500).optional(),
    active: z.boolean().optional(),
  }),
  
  // Staff assignment
  staffAssignment: z.object({
    incidentId: z.string().uuid('Invalid incident ID'),
    staffIds: z.array(z.string().uuid('Invalid staff ID')).optional(),
    assignmentType: z.enum(['manual', 'auto']).default('manual'),
    eventId: z.string().uuid('Invalid event ID'),
    incidentType: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    location: z.string().optional(),
    requiredSkills: z.array(z.string()).optional(),
    bulkAssignments: z.array(z.object({
      incidentId: z.string().uuid('Invalid incident ID'),
      staffIds: z.array(z.string().uuid('Invalid staff ID')),
      assignmentType: z.enum(['manual', 'auto']).default('manual')
    })).optional()
  }),
  
  // Staff assignment update
  staffAssignmentUpdate: z.object({
    incidentId: z.string().uuid('Invalid incident ID'),
    staffIds: z.array(z.string().uuid('Invalid staff ID')),
    assignmentType: z.enum(['manual', 'auto']).default('manual'),
    notes: z.string().optional()
  })
}

// AI-related schemas
export const aiSchemas = {
  // AI insights request
  aiInsights: z.object({
    eventId: commonSchemas.uuid,
    timeRange: z.enum(['1h', '6h', '24h', '7d']).default('24h'),
    includePredictions: z.boolean().default(true),
  }),
  
  // AI chat message
  aiChat: z.object({
    message: z.string().min(1, 'Message is required').max(2000),
    context: z.object({
      eventId: commonSchemas.uuid.optional(),
      userId: commonSchemas.uuid.optional(),
      conversationId: commonSchemas.uuid.optional(),
    }).optional(),
  }),
}

// Social media schemas
export const socialMediaSchemas = {
  // Social media summary request
  socialMediaSummary: z.object({
    eventId: commonSchemas.uuid,
    platforms: z.array(z.enum(['twitter', 'facebook', 'instagram', 'reddit'])).min(1),
    timeRange: z.enum(['1h', '6h', '24h', '7d']).default('24h'),
  }),
}

// File upload schemas
export const fileSchemas = {
  // File upload metadata
  fileUpload: z.object({
    fileName: z.string().min(1).max(255),
    fileType: z.string().min(1).max(100),
    fileSize: commonSchemas.nonNegativeInt,
    incidentId: commonSchemas.uuid.optional(),
    eventId: commonSchemas.uuid.optional(),
  }),
}

// Weather schemas
export const weatherSchemas = {
  // Weather request
  weatherRequest: z.object({
    lat: z.number().min(-90).max(90),
    lon: z.number().min(-180).max(180),
  }),
}

// Pagination schemas
export const paginationSchemas = {
  // Pagination parameters
  pagination: z.object({
    page: commonSchemas.nonNegativeInt.default(1),
    limit: z.number().int().min(1).max(100).default(20),
    sortBy: z.string().max(50).optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
}

// Validation helper function
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context: string
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const validatedData = schema.parse(data)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      logger.warn('Validation failed', { 
        component: 'Validation', 
        action: 'validateRequest', 
        context, 
        errors 
      })
      return { success: false, errors }
    }
    
    logger.error('Unexpected validation error', error, { 
      component: 'Validation', 
      action: 'validateRequest', 
      context 
    })
    return { success: false, errors: ['Internal validation error'] }
  }
}

// Export all schemas
export const schemas = {
  common: commonSchemas,
  incident: incidentSchemas,
  user: userSchemas,
  event: eventSchemas,
  staff: staffSchemas,
  ai: aiSchemas,
  socialMedia: socialMediaSchemas,
  file: fileSchemas,
  weather: weatherSchemas,
  pagination: paginationSchemas,
}
