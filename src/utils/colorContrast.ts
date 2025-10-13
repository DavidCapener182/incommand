// src/utils/colorContrast.ts

/**
 * Color Contrast Utility for WCAG AA Compliance
 * Ensures all text/background combinations meet accessibility standards
 */

// WCAG AA Requirements:
// - Normal text: 4.5:1 contrast ratio
// - Large text (18pt+ or 14pt+ bold): 3:1 contrast ratio
// - UI components: 3:1 contrast ratio

export interface ColorContrastResult {
  ratio: number
  passesAA: boolean
  passesAAA: boolean
  level: 'AA' | 'AAA' | 'FAIL'
}

interface Color {
  r: number
  g: number
  b: number
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): Color {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 }
}

/**
 * Convert RGB to relative luminance
 */
function getRelativeLuminance(color: Color): number {
  const { r, g, b } = color
  
  // Normalize RGB values to 0-1 range
  const normalize = (value: number) => {
    value = value / 255
    return value <= 0.03928 
      ? value / 12.92 
      : Math.pow((value + 0.055) / 1.055, 2.4)
  }
  
  return 0.2126 * normalize(r) + 0.7152 * normalize(g) + 0.0722 * normalize(b)
}

/**
 * Calculate contrast ratio between two colors
 */
export function calculateContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1)
  const rgb2 = hexToRgb(color2)
  
  const lum1 = getRelativeLuminance(rgb1)
  const lum2 = getRelativeLuminance(rgb2)
  
  const lighter = Math.max(lum1, lum2)
  const darker = Math.min(lum1, lum2)
  
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Check if contrast meets WCAG standards
 */
export function checkContrast(
  foreground: string, 
  background: string, 
  fontSize: 'normal' | 'large' = 'normal'
): ColorContrastResult {
  const ratio = calculateContrastRatio(foreground, background)
  
  // WCAG AA requirements
  const aaThreshold = fontSize === 'large' ? 3 : 4.5
  const aaaThreshold = fontSize === 'large' ? 4.5 : 7
  
  const passesAA = ratio >= aaThreshold
  const passesAAA = ratio >= aaaThreshold
  
  let level: 'AA' | 'AAA' | 'FAIL' = 'FAIL'
  if (passesAAA) level = 'AAA'
  else if (passesAA) level = 'AA'
  
  return {
    ratio: Math.round(ratio * 100) / 100,
    passesAA,
    passesAAA,
    level
  }
}

/**
 * Get accessible text color for a background
 */
export function getAccessibleTextColor(
  background: string, 
  fontSize: 'normal' | 'large' = 'normal'
): string {
  const whiteContrast = checkContrast('#FFFFFF', background, fontSize)
  const blackContrast = checkContrast('#000000', background, fontSize)
  
  // Choose the color with better contrast
  if (whiteContrast.ratio > blackContrast.ratio) {
    return whiteContrast.passesAA ? '#FFFFFF' : getContrastColor(background, fontSize)
  } else {
    return blackContrast.passesAA ? '#000000' : getContrastColor(background, fontSize)
  }
}

/**
 * Get a color that meets contrast requirements
 */
function getContrastColor(background: string, fontSize: 'normal' | 'large' = 'normal'): string {
  const targetRatio = fontSize === 'large' ? 3 : 4.5
  const bgRgb = hexToRgb(background)
  const bgLum = getRelativeLuminance(bgRgb)
  
  // If background is dark, return light color; if light, return dark
  if (bgLum < 0.5) {
    return '#FFFFFF'
  } else {
    return '#000000'
  }
}

/**
 * Generate color variants that meet contrast requirements
 */
export function generateAccessibleColors(baseColor: string): {
  text: string
  textSecondary: string
  background: string
  border: string
} {
  const result = checkContrast('#000000', baseColor)
  
  if (result.passesAA) {
    return {
      text: '#000000',
      textSecondary: '#374151', // gray-700
      background: baseColor,
      border: '#6B7280' // gray-500
    }
  } else {
    return {
      text: '#FFFFFF',
      textSecondary: '#E5E7EB', // gray-200
      background: baseColor,
      border: '#9CA3AF' // gray-400
    }
  }
}

/**
 * Common color combinations used in the app
 */
export const colorCombinations = {
  // Text on backgrounds
  textOnWhite: { fg: '#000000', bg: '#FFFFFF' },
  textOnDark: { fg: '#FFFFFF', bg: '#1F2937' },
  textOnBlue: { fg: '#FFFFFF', bg: '#3B82F6' },
  textOnGreen: { fg: '#FFFFFF', bg: '#10B981' },
  textOnRed: { fg: '#FFFFFF', bg: '#EF4444' },
  textOnYellow: { fg: '#000000', bg: '#F59E0B' },
  textOnGray: { fg: '#FFFFFF', bg: '#6B7280' },
  
  // Priority colors
  urgentPriority: { fg: '#FFFFFF', bg: '#DC2626' },
  highPriority: { fg: '#FFFFFF', bg: '#EA580C' },
  mediumPriority: { fg: '#FFFFFF', bg: '#D97706' },
  lowPriority: { fg: '#FFFFFF', bg: '#059669' },
  
  // Status colors
  openStatus: { fg: '#FFFFFF', bg: '#EF4444' },
  closedStatus: { fg: '#FFFFFF', bg: '#10B981' },
  inProgressStatus: { fg: '#FFFFFF', bg: '#3B82F6' },
  
  // Dark mode colors
  darkTextOnDark: { fg: '#F9FAFB', bg: '#111827' },
  darkTextOnBlue: { fg: '#FFFFFF', bg: '#1E40AF' },
  
  // Form elements
  inputText: { fg: '#111827', bg: '#FFFFFF' },
  inputTextDark: { fg: '#F9FAFB', bg: '#374151' },
  placeholderText: { fg: '#9CA3AF', bg: '#FFFFFF' },
  placeholderTextDark: { fg: '#6B7280', bg: '#374151' }
}

/**
 * Audit all color combinations
 */
export function auditColorContrast(): Array<{
  name: string
  foreground: string
  background: string
  result: ColorContrastResult
  recommendation?: string
}> {
  const results = []
  
  for (const [name, colors] of Object.entries(colorCombinations)) {
    const result = checkContrast(colors.fg, colors.bg)
    let recommendation: string | undefined
    
    if (!result.passesAA) {
      const accessibleFg = getAccessibleTextColor(colors.bg)
      recommendation = `Use ${accessibleFg} instead of ${colors.fg} for better contrast`
    }
    
    results.push({
      name,
      foreground: colors.fg,
      background: colors.bg,
      result,
      recommendation
    })
  }
  
  return results
}

/**
 * Check if a Tailwind color class meets contrast requirements
 */
export function checkTailwindContrast(
  textClass: string, 
  bgClass: string, 
  fontSize: 'normal' | 'large' = 'normal'
): ColorContrastResult {
  // Convert Tailwind classes to hex colors
  const colorMap: Record<string, string> = {
    'text-white': '#FFFFFF',
    'text-black': '#000000',
    'text-gray-900': '#111827',
    'text-gray-800': '#1F2937',
    'text-gray-700': '#374151',
    'text-gray-600': '#4B5563',
    'text-gray-500': '#6B7280',
    'text-gray-400': '#9CA3AF',
    'text-gray-300': '#D1D5DB',
    'text-gray-200': '#E5E7EB',
    'text-gray-100': '#F3F4F6',
    'text-blue-600': '#2563EB',
    'text-blue-500': '#3B82F6',
    'text-green-600': '#059669',
    'text-green-500': '#10B981',
    'text-red-600': '#DC2626',
    'text-red-500': '#EF4444',
    'text-yellow-600': '#D97706',
    'text-yellow-500': '#F59E0B',
    'bg-white': '#FFFFFF',
    'bg-black': '#000000',
    'bg-gray-900': '#111827',
    'bg-gray-800': '#1F2937',
    'bg-gray-700': '#374151',
    'bg-gray-600': '#6B7280',
    'bg-gray-500': '#6B7280',
    'bg-gray-400': '#9CA3AF',
    'bg-gray-300': '#D1D5DB',
    'bg-gray-200': '#E5E7EB',
    'bg-gray-100': '#F3F4F6',
    'bg-blue-600': '#2563EB',
    'bg-blue-500': '#3B82F6',
    'bg-green-600': '#059669',
    'bg-green-500': '#10B981',
    'bg-red-600': '#DC2626',
    'bg-red-500': '#EF4444',
    'bg-yellow-600': '#D97706',
    'bg-yellow-500': '#F59E0B'
  }
  
  const foreground = colorMap[textClass] || '#000000'
  const background = colorMap[bgClass] || '#FFFFFF'
  
  return checkContrast(foreground, background, fontSize)
}

/**
 * Generate accessible color palette
 */
export function generateAccessiblePalette(baseHue: number = 220): {
  primary: string
  primaryText: string
  secondary: string
  secondaryText: string
  accent: string
  accentText: string
  background: string
  backgroundText: string
  surface: string
  surfaceText: string
} {
  // This is a simplified version - in practice you'd use a proper color space
  const hslToHex = (h: number, s: number, l: number) => {
    const hue = h / 360
    const saturation = s / 100
    const lightness = l / 100
    
    const c = (1 - Math.abs(2 * lightness - 1)) * saturation
    const x = c * (1 - Math.abs((hue * 6) % 2 - 1))
    const m = lightness - c / 2
    
    let r, g, b
    
    if (hue < 1/6) {
      r = c; g = x; b = 0
    } else if (hue < 2/6) {
      r = x; g = c; b = 0
    } else if (hue < 3/6) {
      r = 0; g = c; b = x
    } else if (hue < 4/6) {
      r = 0; g = x; b = c
    } else if (hue < 5/6) {
      r = x; g = 0; b = c
    } else {
      r = c; g = 0; b = x
    }
    
    r = Math.round((r + m) * 255)
    g = Math.round((g + m) * 255)
    b = Math.round((b + m) * 255)
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  }
  
  return {
    primary: hslToHex(baseHue, 70, 50),
    primaryText: '#FFFFFF',
    secondary: hslToHex(baseHue, 60, 60),
    secondaryText: '#FFFFFF',
    accent: hslToHex(baseHue, 80, 40),
    accentText: '#FFFFFF',
    background: '#FFFFFF',
    backgroundText: '#000000',
    surface: '#F9FAFB',
    surfaceText: '#111827'
  }
}
