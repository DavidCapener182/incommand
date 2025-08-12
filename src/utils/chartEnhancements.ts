export interface ChartColors {
  primary: string[];
  secondary: string[];
  status: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  gradients: {
    blue: string[];
    green: string[];
    purple: string[];
  };
}

export interface AnimationConfig {
  duration: number;
  easing: string;
  delay?: number;
  stagger?: number;
}

export const chartColors: ChartColors = {
  primary: ['#3b82f6', '#6366f1', '#8b5cf6', '#06b6d4', '#10b981'],
  secondary: ['#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#06b6d4'],
  status: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6'
  },
  gradients: {
    blue: ['#3b82f6', '#1d4ed8', '#1e40af'],
    green: ['#10b981', '#059669', '#047857'],
    purple: ['#8b5cf6', '#7c3aed', '#6d28d9']
  }
};

export const getEnhancedChartColors = (theme: 'light' | 'dark' = 'light', count: number = 5): string[] => {
  const colors = theme === 'dark' ? chartColors.secondary : chartColors.primary;
  const result = [];
  
  for (let i = 0; i < count; i++) {
    result.push(colors[i % colors.length]);
  }
  
  return result;
};

export const getAnimationConfig = (type: 'entrance' | 'update' | 'hover', isMobile: boolean = false): AnimationConfig => {
  const baseConfig = {
    duration: isMobile ? 300 : 600,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
  };

  switch (type) {
    case 'entrance':
      return {
        ...baseConfig,
        delay: 100,
        stagger: 50
      };
    case 'update':
      return {
        ...baseConfig,
        duration: isMobile ? 200 : 400
      };
    case 'hover':
      return {
        duration: 200,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
      };
    default:
      return baseConfig;
  }
};

export const getResponsiveOptions = (chartType: 'line' | 'bar' | 'doughnut' | 'pie') => {
  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12
          }
        }
      }
    }
  };

  switch (chartType) {
    case 'line':
      return {
        ...baseOptions,
        scales: {
          x: {
            grid: {
              display: false
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            }
          }
        }
      };
    case 'bar':
      return {
        ...baseOptions,
        scales: {
          x: {
            grid: {
              display: false
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            }
          }
        }
      };
    case 'doughnut':
    case 'pie':
      return {
        ...baseOptions,
        cutout: chartType === 'doughnut' ? '60%' : undefined
      };
    default:
      return baseOptions;
  }
};

export const getGradientFill = (colors: string[], direction: 'horizontal' | 'vertical' = 'horizontal') => {
  const gradientStops = colors.map((color, index) => {
    const percentage = (index / (colors.length - 1)) * 100;
    return `${color} ${percentage}%`;
  }).join(', ');

  return `linear-gradient(${direction === 'horizontal' ? '90deg' : '0deg'}, ${gradientStops})`;
};

export const getChartTheme = (isDark: boolean = false) => {
  return {
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)',
    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    textColor: isDark ? '#ffffff' : '#374151',
    gridColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
  };
};

export const createAnimatedDataset = (data: number[], colors: string[], animationDelay: number = 0) => {
  return {
    data,
    backgroundColor: colors,
    borderColor: colors.map(color => color + '80'),
    borderWidth: 2,
    borderRadius: 4,
    animation: {
      delay: animationDelay,
      duration: 1000,
      easing: 'easeOutQuart'
    }
  };
};

export const getHoverEffects = () => {
  return {
    hover: {
      mode: 'nearest' as const,
      intersect: true,
      animationDuration: 200
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: '#ffffff',
      bodyColor: '#ffffff',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      cornerRadius: 8,
      displayColors: true,
      padding: 12
    }
  };
};
