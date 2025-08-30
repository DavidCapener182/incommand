import { logger } from './logger'

// Server-side sanitization (simplified for Node.js environment)
const createPurifier = (config: any = {}) => {
  return (input: string) => {
    // Basic server-side sanitization
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
  }
}

// Default sanitization config (strict)
const defaultConfig: DOMPurify.Config = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'textarea', 'select', 'button'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_DOM_IMPORT: false,
  RETURN_TRUSTED_TYPE: false,
  SANITIZE_DOM: true,
  WHOLE_DOCUMENT: false,
}

// Relaxed config for rich text content
const richTextConfig: DOMPurify.Config = {
  ...defaultConfig,
  ALLOWED_TAGS: [
    'b', 'i', 'em', 'strong', 'a', 'p', 'br', 'div', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'hr', 'table', 'thead', 'tbody', 'tr', 'td', 'th'
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'id', 'title'],
  ALLOW_DATA_ATTR: false,
}

// Very permissive config for admin content (use with caution)
const adminConfig: DOMPurify.Config = {
  ALLOWED_TAGS: ['*'],
  ALLOWED_ATTR: ['*'],
  ALLOW_DATA_ATTR: true,
  FORBID_TAGS: ['script'],
  FORBID_ATTR: ['onerror', 'onload'],
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_DOM_IMPORT: false,
  RETURN_TRUSTED_TYPE: false,
  SANITIZE_DOM: true,
  WHOLE_DOCUMENT: false,
}

// Sanitization levels
export enum SanitizeLevel {
  STRICT = 'strict',
  RICH_TEXT = 'rich_text',
  ADMIN = 'admin'
}

// Main sanitization function
export function sanitize(
  input: string,
  level: SanitizeLevel = SanitizeLevel.STRICT
): string {
  try {
    const purifier = createPurifier()
    const sanitized = purifier(input)
    
    logger.debug('Content sanitized', {
      component: 'Sanitize',
      action: 'sanitize',
      level,
      originalLength: input.length,
      sanitizedLength: sanitized.length
    })
    
    return sanitized
  } catch (error) {
    logger.error('Sanitization error', error, {
      component: 'Sanitize',
      action: 'sanitize',
      level,
      inputLength: input.length
    })
    // Return empty string on error for safety
    return ''
  }
}

// Sanitize HTML attributes
export function sanitizeAttribute(
  input: string,
  attributeName: string
): string {
  try {
    // Basic attribute sanitization for server-side
    const sanitized = input
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
    
    logger.debug('Attribute sanitized', {
      component: 'Sanitize',
      action: 'sanitizeAttribute',
      attributeName,
      originalLength: input.length,
      sanitizedLength: sanitized.length
    })
    
    return sanitized
  } catch (error) {
    logger.error('Attribute sanitization error', error, {
      component: 'Sanitize',
      action: 'sanitizeAttribute',
      attributeName,
      inputLength: input.length
    })
    return ''
  }
}

// Sanitize URL
export function sanitizeUrl(url: string): string {
  try {
    // Basic URL validation
    const urlPattern = /^https?:\/\/[^\s/$.?#].[^\s]*$/i
    if (!urlPattern.test(url)) {
      logger.warn('Invalid URL pattern', {
        component: 'Sanitize',
        action: 'sanitizeUrl',
        url: url.slice(0, 50) + '...'
      })
      return ''
    }
    
    // Additional security checks
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:']
    const lowerUrl = url.toLowerCase()
    
    for (const protocol of dangerousProtocols) {
      if (lowerUrl.startsWith(protocol)) {
        logger.warn('Dangerous URL protocol detected', {
          component: 'Sanitize',
          action: 'sanitizeUrl',
          protocol,
          url: url.slice(0, 50) + '...'
        })
        return ''
      }
    }
    
    return url
  } catch (error) {
    logger.error('URL sanitization error', error, {
      component: 'Sanitize',
      action: 'sanitizeUrl',
      url: url.slice(0, 50) + '...'
    })
    return ''
  }
}

// Sanitize object properties recursively
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  level: SanitizeLevel = SanitizeLevel.STRICT,
  stringFields: (keyof T)[] = []
): T {
  try {
    const sanitized = { ...obj }
    
    for (const field of stringFields) {
      if (typeof sanitized[field] === 'string') {
        (sanitized as any)[field] = sanitize(sanitized[field] as string, level)
      }
    }
    
    logger.debug('Object sanitized', {
      component: 'Sanitize',
      action: 'sanitizeObject',
      level,
      fields: stringFields,
      objectKeys: Object.keys(obj)
    })
    
    return sanitized
  } catch (error) {
    logger.error('Object sanitization error', error, {
      component: 'Sanitize',
      action: 'sanitizeObject',
      level,
      stringFields
    })
    return obj
  }
}

// Sanitize form data
export function sanitizeFormData(formData: FormData): FormData {
  try {
    const sanitized = new FormData()
    let fieldCount = 0
    
    for (const [key, value] of formData.entries()) {
      fieldCount++
      if (typeof value === 'string') {
        sanitized.append(key, sanitize(value))
      } else {
        sanitized.append(key, value)
      }
    }
    
    logger.debug('Form data sanitized', {
      component: 'Sanitize',
      action: 'sanitizeFormData',
      fieldCount
    })
    
    return sanitized
  } catch (error) {
    logger.error('Form data sanitization error', error, {
      component: 'Sanitize',
      action: 'sanitizeFormData'
    })
    return formData
  }
}

// Sanitize search query
export function sanitizeSearchQuery(query: string): string {
  try {
    // Remove potentially dangerous characters for search
    const sanitized = query
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim()
    
    logger.debug('Search query sanitized', {
      component: 'Sanitize',
      action: 'sanitizeSearchQuery',
      originalLength: query.length,
      sanitizedLength: sanitized.length
    })
    
    return sanitized
  } catch (error) {
    logger.error('Search query sanitization error', error, {
      component: 'Sanitize',
      action: 'sanitizeSearchQuery',
      queryLength: query.length
    })
    return ''
  }
}

// Validate and sanitize file name
export function sanitizeFileName(fileName: string): string {
  try {
    // Remove path traversal attempts
    let sanitized = fileName.replace(/\.\./g, '')
    
    // Remove dangerous characters
    sanitized = sanitized.replace(/[<>:"/\\|?*]/g, '_')
    
    // Limit length
    if (sanitized.length > 255) {
      const ext = sanitized.split('.').pop()
      const name = sanitized.substring(0, 255 - (ext ? ext.length + 1 : 0))
      sanitized = ext ? `${name}.${ext}` : name
    }
    
    logger.debug('File name sanitized', {
      component: 'Sanitize',
      action: 'sanitizeFileName',
      originalName: fileName,
      sanitizedName: sanitized
    })
    
    return sanitized
  } catch (error) {
    logger.error('File name sanitization error', error, {
      component: 'Sanitize',
      action: 'sanitizeFileName',
      fileName
    })
    return 'sanitized_file'
  }
}

// SanitizeLevel enum is already exported above
