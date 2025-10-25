/**
 * Print utilities to ensure consistent, margin-free printing
 */

export interface PrintOptions {
  /** Whether to show the print dialog or print immediately */
  showDialog?: boolean;
  /** Whether to force no margins */
  forceNoMargins?: boolean;
  /** Page orientation */
  orientation?: 'portrait' | 'landscape';
  /** Page size */
  pageSize?: 'A4' | 'A3' | 'Letter';
  /** Whether to include print styles */
  includePrintStyles?: boolean;
}

/**
 * Enhanced print function that ensures no margins are applied
 */
export const printWithNoMargins = (options: PrintOptions = {}): void => {
  const {
    showDialog = true,
    forceNoMargins = true,
    orientation = 'landscape',
    pageSize = 'A4',
    includePrintStyles = true
  } = options;

  if (includePrintStyles) {
    // Inject comprehensive print styles
    injectPrintStyles(forceNoMargins, orientation, pageSize);
  }

  if (showDialog) {
    // Use browser's print dialog
    window.print();
  } else {
    // For programmatic printing (if supported by browser)
    console.warn('Direct printing without dialog is not supported by most browsers');
    window.print();
  }
};

/**
 * Inject comprehensive print styles to ensure no margins
 */
const injectPrintStyles = (
  forceNoMargins: boolean,
  orientation: 'portrait' | 'landscape',
  pageSize: 'A4' | 'A3' | 'Letter'
): void => {
  // Remove any existing print styles
  const existingStyle = document.getElementById('print-margin-override');
  if (existingStyle) {
    existingStyle.remove();
  }

  // Create new style element
  const style = document.createElement('style');
  style.id = 'print-margin-override';
  style.type = 'text/css';

  const css = `
    @media print {
      @page {
        size: ${pageSize} ${orientation};
        margin: 0 !important;
        padding: 0 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        height: 100% !important;
        overflow: visible !important;
      }
      
      * {
        box-sizing: border-box !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      
      ${forceNoMargins ? `
      /* Force no margins on all elements */
      *, *::before, *::after {
        margin: 0 !important;
      }
      
      /* Override any browser default margins */
      @page :first { margin: 0 !important; }
      @page :left { margin: 0 !important; }
      @page :right { margin: 0 !important; }
      ` : ''}
      
      /* Ensure print content is visible */
      body * { visibility: hidden !important; }
      .print-content, .print-content * { visibility: visible !important; }
      
      /* Hide non-printable elements */
      .no-print, .print\\:hidden { display: none !important; }
      
      /* Optimize for print */
      .card-glow:hover,
      .widget-update:hover {
        box-shadow: none !important;
        transform: none !important;
      }
      
      /* Remove animations and transitions */
      * {
        animation: none !important;
        transition: none !important;
        transform: none !important;
      }
    }
  `;

  style.textContent = css;
  document.head.appendChild(style);
};

/**
 * Remove print styles
 */
export const removePrintStyles = (): void => {
  const existingStyle = document.getElementById('print-margin-override');
  if (existingStyle) {
    existingStyle.remove();
  }
};

/**
 * Set up print event listeners to ensure styles are applied
 */
export const setupPrintListeners = (): void => {
  // Apply styles before print
  window.addEventListener('beforeprint', () => {
    injectPrintStyles(true, 'landscape', 'A4');
  });

  // Clean up after print
  window.addEventListener('afterprint', () => {
    // Keep styles for a moment in case of print preview
    setTimeout(() => {
      removePrintStyles();
    }, 1000);
  });
};

/**
 * Print a specific element with no margins
 */
export const printElement = (elementId: string, options: PrintOptions = {}): void => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id "${elementId}" not found`);
    return;
  }

  // Add print-content class to the element
  element.classList.add('print-content');
  
  // Apply print styles
  printWithNoMargins(options);
  
  // Remove the class after printing
  setTimeout(() => {
    element.classList.remove('print-content');
  }, 2000);
};

/**
 * Initialize print utilities
 */
export const initializePrintUtils = (): void => {
  setupPrintListeners();
  
  // Add global print styles to the document
  if (!document.getElementById('global-print-styles')) {
    const style = document.createElement('style');
    style.id = 'global-print-styles';
    style.textContent = `
      @media print {
        @page { margin: 0 !important; padding: 0 !important; }
        html, body { margin: 0 !important; padding: 0 !important; }
        *, *::before, *::after { margin: 0 !important; }
      }
    `;
    document.head.appendChild(style);
  }
};
