// Mock Supabase client
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      then: jest.fn(),
    })),
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
    })),
  },
}))

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    dev: jest.fn(),
  },
  logError: jest.fn(),
  logWarn: jest.fn(),
  logInfo: jest.fn(),
  logDebug: jest.fn(),
  logDev: jest.fn(),
}))

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: jest.fn(({ children, ...props }) => ({ type: 'div', props, children })),
    button: jest.fn(({ children, ...props }) => ({ type: 'button', props, children })),
    span: jest.fn(({ children, ...props }) => ({ type: 'span', props, children })),
  },
  AnimatePresence: jest.fn(({ children }) => ({ type: 'AnimatePresence', children })),
}))

// Mock react-modal
jest.mock('react-modal', () => {
  const Modal = jest.fn(({ children, isOpen, ...props }) => {
    if (!isOpen) return null
    return { type: 'modal', props, children }
  })
  ;(Modal as any).setAppElement = jest.fn()
  return Modal
})

// Mock @headlessui/react
jest.mock('@headlessui/react', () => ({
  Menu: jest.fn(({ children }) => ({ type: 'menu', children })),
  Transition: jest.fn(({ children }) => ({ type: 'transition', children })),
  Dialog: jest.fn(({ children, open, ...props }) => {
    if (!open) return null
    return { type: 'dialog', props, children }
  }),
}))

// Mock @heroicons/react
jest.mock('@heroicons/react/24/outline', () => ({
  UsersIcon: jest.fn(() => ({ type: 'users-icon' })),
  ExclamationTriangleIcon: jest.fn(() => ({ type: 'exclamation-triangle-icon' })),
  FolderOpenIcon: jest.fn(() => ({ type: 'folder-open-icon' })),
  ClockIcon: jest.fn(() => ({ type: 'clock-icon' })),
  CheckCircleIcon: jest.fn(() => ({ type: 'check-circle-icon' })),
  UserGroupIcon: jest.fn(() => ({ type: 'user-group-icon' })),
  HeartIcon: jest.fn(() => ({ type: 'heart-icon' })),
  ClipboardDocumentCheckIcon: jest.fn(() => ({ type: 'clipboard-document-check-icon' })),
  QuestionMarkCircleIcon: jest.fn(() => ({ type: 'question-mark-circle-icon' })),
  PlusIcon: jest.fn(() => ({ type: 'plus-icon' })),
}))

jest.mock('@heroicons/react/20/solid', () => ({
  ChevronDownIcon: jest.fn(() => ({ type: 'chevron-down-icon' })),
}))

// Mock what3words
jest.mock('@what3words/api', () => ({
  default: {
    convertTo3wa: jest.fn(),
    convertToCoordinates: jest.fn(),
  },
}))

// Mock geocoding utility
jest.mock('@/utils/geocoding', () => ({
  geocodeAddress: jest.fn().mockResolvedValue({ lat: 51.5074, lon: -0.1278 }),
}))

// Mock staff availability hook
jest.mock('@/hooks/useStaffAvailability', () => ({
  useStaffAvailability: jest.fn(() => ({
    stats: {
      total: 10,
      available: 8,
      assigned: 2,
      unavailable: 0,
    },
    loading: false,
    error: null,
  })),
}))

// Mock incident filters
jest.mock('@/utils/incidentFilters', () => ({
  filterIncidents: jest.fn((incidents) => incidents),
  getUniqueIncidentTypes: jest.fn(() => ['medical', 'ejection', 'refusal']),
  getUniquePriorities: jest.fn(() => ['low', 'medium', 'high', 'urgent']),
  getUniqueStatuses: jest.fn(() => ['open', 'in-progress', 'closed']),
}))

// Mock incident styles
jest.mock('@/utils/incidentStyles', () => ({
  getIncidentTypeStyle: jest.fn(() => ({
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-200',
  })),
}))

// Mock Toast component
jest.mock('@/components/Toast', () => ({
  __esModule: true,
  default: jest.fn(({ messages, onRemove }) => ({ type: 'toast-container', messages, onRemove })),
  useToast: jest.fn(() => ({
    messages: [],
    addToast: jest.fn(),
    removeToast: jest.fn(),
  })),
}))

// Mock all other components
jest.mock('@/components/IncidentTable', () => ({
  __esModule: true,
  default: jest.fn((props) => ({ type: 'incident-table', props })),
}))

jest.mock('@/components/CurrentEvent', () => ({
  __esModule: true,
  default: jest.fn((props) => ({ type: 'current-event', props })),
}))

jest.mock('@/components/EventCreationModal', () => ({
  __esModule: true,
  default: jest.fn((props) => ({ type: 'event-creation-modal', props })),
}))

jest.mock('@/components/IncidentCreationModal', () => ({
  __esModule: true,
  default: jest.fn((props) => ({ type: 'incident-creation-modal', props })),
}))

jest.mock('@/components/VenueOccupancy', () => ({
  __esModule: true,
  default: jest.fn((props) => ({ type: 'venue-occupancy', props })),
}))

jest.mock('@/components/WeatherCard', () => ({
  __esModule: true,
  default: jest.fn((props) => ({ type: 'weather-card', props })),
}))

jest.mock('@/components/SocialMediaMonitoringCard', () => ({
  __esModule: true,
  default: jest.fn((props) => ({ type: 'social-media-monitoring-card', props })),
}))

jest.mock('@/components/What3WordsSearchCard', () => ({
  __esModule: true,
  default: jest.fn((props) => ({ type: 'what3words-search-card', props })),
}))

jest.mock('@/components/AttendanceModal', () => ({
  __esModule: true,
  default: jest.fn((props) => ({ type: 'attendance-modal', props })),
}))

jest.mock('@/components/ui/MultiSelectFilter', () => ({
  __esModule: true,
  default: jest.fn((props) => ({ type: 'multi-select-filter', props })),
}))

jest.mock('@/components/RotatingText', () => ({
  __esModule: true,
  default: jest.fn((props) => ({ type: 'rotating-text', props })),
}))
