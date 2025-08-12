// Sidebar types and interfaces

export type SectionStatus = 'loading' | 'ready' | 'error' | 'none';

export interface QuickActionItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  badge?: number | string;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}

export interface NavigationItem {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  id: string;
}

export interface SidebarProps {
  navigation: NavigationItem[];
  activeItem: string;
  onItemClick: (id: string) => void;
  title: string;
  sectionStatus?: Record<string, SectionStatus>;
  quickActions?: QuickActionItem[];
  onWidthChange?: (width: number) => void;
  className?: string;
}

export interface SidebarState {
  collapsed: boolean;
  mobileOpen: boolean;
  width: number;
  isMobile: boolean;
}
