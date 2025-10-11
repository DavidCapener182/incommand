/**
 * Z-Index Hierarchy for the Application
 * 
 * This file defines the z-index values used throughout the application
 * to ensure proper layering of UI components and prevent overlapping issues.
 * 
 * Hierarchy (from lowest to highest):
 * 
 * z-[10]  - Base content
 * z-[20]  - Sticky elements
 * z-[30]  - Dropdowns and tooltips
 * z-[40]  - Navigation elements (top nav, sidebars)
 * z-[50]  - Bottom navigation and persistent UI elements
 * z-[60]  - Modals and overlays (always above bottom nav)
 * z-[70]  - Modal overlays (like image viewers, nested modals)
 * z-[80]  - Toast notifications and critical alerts
 * z-[90]  - Loading screens and system overlays
 * z-[100] - Debug tools and development overlays
 */

export const Z_INDEX = {
  // Base content
  CONTENT: 'z-[10]',
  
  // Sticky elements
  STICKY: 'z-[20]',
  
  // Dropdowns and tooltips
  DROPDOWN: 'z-[30]',
  
  // Navigation elements
  NAVIGATION: 'z-[40]',
  
  // Bottom navigation and persistent UI
  BOTTOM_NAV: 'z-[50]',
  
  // Modals and overlays (always above bottom nav)
  MODAL: 'z-[60]',
  
  // Modal overlays (nested modals, image viewers)
  MODAL_OVERLAY: 'z-[70]',
  
  // Toast notifications
  TOAST: 'z-[80]',
  
  // Loading screens
  LOADING: 'z-[90]',
  
  // Debug tools
  DEBUG: 'z-[100]',
} as const;

export default Z_INDEX;
