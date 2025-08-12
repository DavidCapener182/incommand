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

// Comparison chart configurations
export const getComparisonChartColors = (theme: 'light' | 'dark', datasetCount: number = 2) => {
  const baseColors = theme === 'dark' ? chartColors.secondary : chartColors.primary;
  const comparisonColors = [];
  
  for (let i = 0; i < datasetCount; i++) {
    const color = baseColors[i % baseColors.length];
    comparisonColors.push(color);
    comparisonColors.push(color + '40'); // Transparent version for comparison
  }
  
  return comparisonColors;
};

export const createComparisonDataset = (currentData: any[], comparisonData: any[], labels: string[]) => {
  return [
    {
      label: 'Current Period',
      data: currentData,
      borderColor: chartColors.primary[0],
      backgroundColor: chartColors.primary[0] + '20',
      borderWidth: 2,
      fill: false,
      tension: 0.2
    },
    {
      label: 'Comparison Period',
      data: comparisonData,
      borderColor: chartColors.secondary[0],
      backgroundColor: chartColors.secondary[0] + '20',
      borderWidth: 2,
      fill: false,
      tension: 0.2,
      borderDash: [5, 5]
    }
  ];
};

export const getComparisonTooltips = () => {
  return {
    callbacks: {
      label: function(context: any) {
        const label = context.dataset.label || '';
        const value = context.parsed.y;
        return `${label}: ${value}`;
      },
      afterLabel: function(context: any) {
        // Add comparison information if available
        if (context.datasetIndex === 0 && context.chart.data.datasets.length > 1) {
          const currentValue = context.parsed.y;
          const comparisonValue = context.chart.data.datasets[1].data[context.dataIndex];
          if (comparisonValue !== undefined) {
            const change = currentValue - comparisonValue;
            const changePercent = comparisonValue > 0 ? (change / comparisonValue) * 100 : 0;
            const sign = change >= 0 ? '+' : '';
            return `Change: ${sign}${change.toFixed(1)} (${sign}${changePercent.toFixed(1)}%)`;
          }
        }
        return '';
      }
    }
  };
};

export const getComparisonLegend = () => {
  return {
    position: 'top' as const,
    labels: {
      usePointStyle: true,
      padding: 20,
      font: {
        size: 12
      },
      generateLabels: function(chart: any) {
        const datasets = chart.data.datasets;
        return datasets.map((dataset: any, index: number) => ({
          text: dataset.label,
          fillStyle: dataset.borderColor,
          strokeStyle: dataset.borderColor,
          lineWidth: 2,
          lineDash: dataset.borderDash || [],
          pointStyle: index === 0 ? 'circle' : 'line',
          hidden: !chart.isDatasetVisible(index),
          index: index
        }));
      }
    }
  };
};

// Filtered data chart options
export const getFilteredChartAnnotations = (filters: any, events: any[]) => {
  const annotations: any = {};
  
  if (filters?.dateRange) {
    annotations.dateRange = {
      type: 'box',
      xMin: new Date(filters.dateRange.from).getTime(),
      xMax: new Date(filters.dateRange.to).getTime(),
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      borderColor: 'rgba(59, 130, 246, 0.3)',
      borderWidth: 1,
      label: {
        content: 'Filtered Date Range',
        position: 'start'
      }
    };
  }
  
  return annotations;
};

export const getFilteredAxisOptions = (dateRange: any) => {
  return {
    x: {
      min: dateRange?.from ? new Date(dateRange.from).getTime() : undefined,
      max: dateRange?.to ? new Date(dateRange.to).getTime() : undefined,
      ticks: {
        callback: function(value: any) {
          return new Date(value).toLocaleDateString();
        }
      }
    }
  };
};

// Export-optimized configurations
export const getExportChartOptions = (format: 'pdf' | 'image' = 'pdf') => {
  const baseOptions = {
    responsive: false,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const
      },
      tooltip: {
        enabled: false
      }
    }
  };

  if (format === 'pdf') {
    return {
      ...baseOptions,
      width: 800,
      height: 400
    };
  }

  return {
    ...baseOptions,
    width: 1200,
    height: 600
  };
};

export const getHighResolutionConfig = () => {
  return {
    responsive: false,
    maintainAspectRatio: false,
    width: 1200,
    height: 600,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          font: {
            size: 14
          }
        }
      },
      tooltip: {
        enabled: false
      }
    }
  };
};

export const getCompactChartOptions = () => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: true,
        mode: 'index' as const,
        intersect: false
      }
    },
    scales: {
      x: {
        display: false
      },
      y: {
        display: false
      }
    }
  };
};

// Performance optimizations
export const getDataSamplingConfig = (dataSize: number) => {
  if (dataSize > 1000) {
    return {
      sampling: {
        mode: 'lttb' as const,
        threshold: 1000
      }
    };
  }
  return {};
};

export const getLazyLoadingOptions = () => {
  return {
    animation: {
      duration: 0
    },
    plugins: {
      legend: {
        display: false
      }
    }
  };
};

export const getMemoryOptimizedOptions = () => {
  return {
    responsive: false,
    maintainAspectRatio: false,
    animation: {
      duration: 0
    },
    plugins: {
      tooltip: {
        enabled: false
      }
    }
  };
};

// Accessibility enhancements
export const getA11yOptions = () => {
  return {
    plugins: {
      legend: {
        labels: {
          generateLabels: function(chart: any) {
            const datasets = chart.data.datasets;
            return datasets.map((dataset: any, index: number) => ({
              text: `${dataset.label} (${dataset.data.reduce((a: number, b: number) => a + b, 0)} total)`,
              fillStyle: dataset.backgroundColor,
              strokeStyle: dataset.borderColor,
              lineWidth: 2,
              pointStyle: 'circle',
              hidden: !chart.isDatasetVisible(index),
              index: index
            }));
          }
        }
      }
    }
  };
};

export const getColorBlindFriendlyPalette = () => {
  return [
    '#1f77b4', // blue
    '#ff7f0e', // orange
    '#2ca02c', // green
    '#d62728', // red
    '#9467bd', // purple
    '#8c564b', // brown
    '#e377c2', // pink
    '#7f7f7f', // gray
    '#bcbd22', // olive
    '#17becf'  // cyan
  ];
};

export const getHighContrastOptions = () => {
  return {
    plugins: {
      legend: {
        labels: {
          color: '#000000'
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#000000'
        },
        grid: {
          color: '#000000'
        }
      },
      y: {
        ticks: {
          color: '#000000'
        },
        grid: {
          color: '#000000'
        }
      }
    }
  };
};
