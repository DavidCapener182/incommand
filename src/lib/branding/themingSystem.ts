/**
 * White-Label Theming System
 * Custom branding and theming for enterprise clients
 */

export interface BrandingConfig {
  organizationId: string
  logo: {
    light: string
    dark: string
    favicon: string
    appleTouchIcon: string
  }
  colors: {
    primary: string
    secondary: string
    accent: string
    success: string
    warning: string
    error: string
    info: string
  }
  typography: {
    fontFamily: string
    headingFont?: string
    fontSize: 'small' | 'medium' | 'large'
  }
  customCSS?: string
  customDomain?: string
  appName: string
  tagline?: string
  loginBackground?: string
}

export const DEFAULT_BRANDING: Omit<BrandingConfig, 'organizationId'> = {
  logo: {
    light: '/icon.png',
    dark: '/icon.png',
    favicon: '/favicon.ico',
    appleTouchIcon: '/apple-touch-icon.png'
  },
  colors: {
    primary: '#3B82F6',
    secondary: '#8B5CF6',
    accent: '#10B981',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6'
  },
  typography: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: 'medium'
  },
  appName: 'inCommand',
  tagline: 'Professional Event Command Center'
}

export class ThemingSystem {
  private brandingConfigs: Map<string, BrandingConfig> = new Map()

  /**
   * Set branding for organization
   */
  setBranding(organizationId: string, branding: Partial<BrandingConfig>): BrandingConfig {
    const config: BrandingConfig = {
      organizationId,
      ...DEFAULT_BRANDING,
      ...branding
    }

    this.brandingConfigs.set(organizationId, config)
    return config
  }

  /**
   * Get branding for organization
   */
  getBranding(organizationId: string): BrandingConfig {
    return this.brandingConfigs.get(organizationId) || {
      organizationId,
      ...DEFAULT_BRANDING
    }
  }

  /**
   * Generate CSS variables from branding
   */
  generateCSSVariables(branding: BrandingConfig): string {
    return `
      :root {
        --color-primary: ${branding.colors.primary};
        --color-secondary: ${branding.colors.secondary};
        --color-accent: ${branding.colors.accent};
        --color-success: ${branding.colors.success};
        --color-warning: ${branding.colors.warning};
        --color-error: ${branding.colors.error};
        --color-info: ${branding.colors.info};
        --font-family: ${branding.typography.fontFamily};
        --font-size-base: ${this.getFontSizeValue(branding.typography.fontSize)};
      }
      
      ${branding.customCSS || ''}
    `.trim()
  }

  /**
   * Generate Tailwind config override
   */
  generateTailwindConfig(branding: BrandingConfig): any {
    return {
      theme: {
        extend: {
          colors: {
            primary: branding.colors.primary,
            secondary: branding.colors.secondary,
            accent: branding.colors.accent
          },
          fontFamily: {
            sans: [branding.typography.fontFamily, 'sans-serif']
          }
        }
      }
    }
  }

  /**
   * Apply branding to document
   */
  applyBranding(organizationId: string): void {
    const branding = this.getBranding(organizationId)
    
    // Update document title
    document.title = branding.appName

    // Update favicon
    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement
    if (favicon) {
      favicon.href = branding.logo.favicon
    }

    // Inject CSS variables
    const styleId = 'custom-branding-styles'
    let styleElement = document.getElementById(styleId) as HTMLStyleElement
    
    if (!styleElement) {
      styleElement = document.createElement('style')
      styleElement.id = styleId
      document.head.appendChild(styleElement)
    }

    styleElement.textContent = this.generateCSSVariables(branding)
  }

  /**
   * Remove branding (revert to default)
   */
  removeBranding(): void {
    const styleElement = document.getElementById('custom-branding-styles')
    if (styleElement) {
      styleElement.remove()
    }

    document.title = DEFAULT_BRANDING.appName
  }

  /**
   * Validate branding configuration
   */
  validateBranding(branding: Partial<BrandingConfig>): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Validate colors
    if (branding.colors) {
      for (const [key, color] of Object.entries(branding.colors)) {
        if (!this.isValidColor(color)) {
          errors.push(`Invalid color for ${key}: ${color}`)
        }
      }
    }

    // Validate URLs
    if (branding.logo?.light && !this.isValidURL(branding.logo.light)) {
      errors.push('Invalid logo URL')
    }

    if (branding.customDomain && !this.isValidDomain(branding.customDomain)) {
      errors.push('Invalid custom domain')
    }

    // Validate app name
    if (branding.appName && (branding.appName.length < 2 || branding.appName.length > 50)) {
      errors.push('App name must be 2-50 characters')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Private helper methods

  private getFontSizeValue(size: 'small' | 'medium' | 'large'): string {
    const sizes = {
      small: '14px',
      medium: '16px',
      large: '18px'
    }
    return sizes[size]
  }

  private isValidColor(color: string): boolean {
    // Basic color validation
    return /^#[0-9A-F]{6}$/i.test(color) || 
           /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/.test(color) ||
           /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/.test(color)
  }

  private isValidURL(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return url.startsWith('/')
    }
  }

  private isValidDomain(domain: string): boolean {
    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i
    return domainRegex.test(domain)
  }
}

// Export singleton instance
export const themingSystem = new ThemingSystem()
