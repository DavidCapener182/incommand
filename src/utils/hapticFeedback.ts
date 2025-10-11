/**
 * Haptic Feedback Utility
 * Provides consistent haptic feedback patterns throughout the app
 */

export type HapticPattern = 
  | 'light'        // 10ms - subtle feedback
  | 'medium'       // 25ms - standard feedback  
  | 'heavy'        // 50ms - strong feedback
  | 'success'      // 10ms + 10ms + 10ms - success pattern
  | 'error'        // 50ms + 25ms + 50ms - error pattern
  | 'warning'      // 25ms + 25ms - warning pattern
  | 'selection'    // 5ms - selection feedback
  | 'impact'       // 30ms - impact feedback

interface HapticConfig {
  enabled: boolean
  intensity: 'low' | 'medium' | 'high'
}

class HapticFeedback {
  private config: HapticConfig = {
    enabled: true,
    intensity: 'medium'
  }

  constructor() {
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      this.config.enabled = 'vibrate' in navigator

      const savedConfig = window.localStorage.getItem('hapticFeedback')
      if (savedConfig) {
        try {
          const parsed = JSON.parse(savedConfig)
          this.config = { ...this.config, ...parsed }
        } catch (e) {
          console.warn('Failed to parse haptic feedback config')
        }
      }
    } else {
      this.config.enabled = false
    }
  }

  /**
   * Trigger haptic feedback with a specific pattern
   */
  trigger(pattern: HapticPattern): void {
    if (!this.config.enabled || typeof navigator === 'undefined') return

    const patterns = {
      light: [10],
      medium: [25],
      heavy: [50],
      success: [10, 10, 10],
      error: [50, 25, 50],
      warning: [25, 25],
      selection: [5],
      impact: [30]
    }

    const basePattern = patterns[pattern]
    const adjustedPattern = this.adjustIntensity(basePattern)

    try {
      navigator.vibrate(adjustedPattern)
    } catch (e) {
      console.warn('Haptic feedback failed:', e)
    }
  }

  /**
   * Adjust vibration intensity based on user preference
   */
  private adjustIntensity(pattern: number[]): number[] {
    const multiplier = {
      low: 0.5,
      medium: 1.0,
      high: 1.5
    }[this.config.intensity]

    return pattern.map(duration => Math.round(duration * multiplier))
  }

  /**
   * Update haptic feedback configuration
   */
  updateConfig(config: Partial<HapticConfig>): void {
    this.config = { ...this.config, ...config }
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('hapticFeedback', JSON.stringify(this.config))
    }
  }

  /**
   * Enable or disable haptic feedback
   */
  setEnabled(enabled: boolean): void {
    this.updateConfig({ enabled })
  }

  /**
   * Set haptic feedback intensity
   */
  setIntensity(intensity: 'low' | 'medium' | 'high'): void {
    this.updateConfig({ intensity })
  }

  /**
   * Get current configuration
   */
  getConfig(): HapticConfig {
    return { ...this.config }
  }

  /**
   * Check if haptic feedback is available
   */
  isAvailable(): boolean {
    return typeof navigator !== 'undefined' && 'vibrate' in navigator
  }
}

// Create singleton instance
export const haptic = new HapticFeedback()

// Convenience functions for common patterns
export const triggerHaptic = {
  light: () => haptic.trigger('light'),
  medium: () => haptic.trigger('medium'),
  heavy: () => haptic.trigger('heavy'),
  success: () => haptic.trigger('success'),
  error: () => haptic.trigger('error'),
  warning: () => haptic.trigger('warning'),
  selection: () => haptic.trigger('selection'),
  impact: () => haptic.trigger('impact')
}

// React hook for haptic feedback
export function useHaptic() {
  return {
    trigger: haptic.trigger.bind(haptic),
    triggerHaptic,
    setEnabled: haptic.setEnabled.bind(haptic),
    setIntensity: haptic.setIntensity.bind(haptic),
    getConfig: haptic.getConfig.bind(haptic),
    isAvailable: haptic.isAvailable.bind(haptic)
  }
}
