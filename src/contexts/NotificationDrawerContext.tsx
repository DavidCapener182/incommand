'use client'

import React, { createContext, useContext, useState } from 'react';

interface NotificationDrawerContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const NotificationDrawerContext = createContext<NotificationDrawerContextType>({
  isOpen: false,
  setIsOpen: () => {}
});

export const useNotificationDrawer = () => useContext(NotificationDrawerContext);

export function NotificationDrawerProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <NotificationDrawerContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </NotificationDrawerContext.Provider>
  );
} 