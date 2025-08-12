import { useState, useEffect, useCallback, useMemo } from 'react';

interface UseSidebarReturn {
  collapsed: boolean;
  isMobile: boolean;
  sidebarWidth: number;
  toggleCollapsed: () => void;
  setMobileOpen: (open: boolean) => void;
  mobileOpen: boolean;
}

export function useSidebar(): UseSidebarReturn {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sidebarCollapsed');
      return stored ? JSON.parse(stored) : false;
    }
    return false;
  });

  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Detect mobile screens
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Calculate sidebar width
  const sidebarWidth = useMemo(() => {
    if (isMobile) {
      return mobileOpen ? 256 : 0;
    }
    return collapsed ? 64 : 256;
  }, [collapsed, isMobile, mobileOpen]);

  // Update CSS custom property
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--sidebar-width', `${sidebarWidth}px`);
      document.documentElement.setAttribute('data-sidebar-collapsed', collapsed.toString());
    }
  }, [sidebarWidth, collapsed]);

  // Persist collapsed state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarCollapsed', JSON.stringify(collapsed));
    }
  }, [collapsed]);

  // Toggle collapsed state
  const toggleCollapsed = useCallback(() => {
    setCollapsed(prev => !prev);
  }, []);

  // Handle mobile overlay
  const handleSetMobileOpen = useCallback((open: boolean) => {
    setMobileOpen(open);
    // Prevent body scroll when mobile sidebar is open
    if (typeof document !== 'undefined') {
      document.body.style.overflow = open ? 'hidden' : '';
    }
  }, []);

  return {
    collapsed,
    isMobile,
    sidebarWidth,
    toggleCollapsed,
    setMobileOpen: handleSetMobileOpen,
    mobileOpen,
  };
}

