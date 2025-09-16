'use client'

import React, { useEffect, useRef } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { useSidebar } from '../hooks/useSidebar'
import { SidebarProps, SectionStatus } from '../types/sidebar'

export default function IconSidebar({ 
  navigation, 
  activeItem, 
  onItemClick, 
  title, 
  sectionStatus = {},
  quickActions = [],
  onWidthChange,
  className = ''
}: SidebarProps) {
  const { 
    collapsed, 
    isMobile, 
    sidebarWidth, 
    toggleCollapsed, 
    setMobileOpen, 
    mobileOpen 
  } = useSidebar()
  
  const sidebarRef = useRef<HTMLDivElement>(null)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const touchEndRef = useRef<{ x: number; y: number } | null>(null)

  // Emit width changes to parent
  useEffect(() => {
    onWidthChange?.(sidebarWidth)
  }, [sidebarWidth, onWidthChange])

  // Touch event handlers for swipe gestures
  useEffect(() => {
    if (!isMobile) return

    const handleTouchStart = (e: TouchEvent) => {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      touchEndRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      }
    }

    const handleTouchEnd = () => {
      if (!touchStartRef.current || !touchEndRef.current) return

      const startX = touchStartRef.current.x
      const endX = touchEndRef.current.x
      const startY = touchStartRef.current.y
      const endY = touchEndRef.current.y

      const deltaX = endX - startX
      const deltaY = endY - startY

      // Check if it's a horizontal swipe (more horizontal than vertical)
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        const threshold = 50 // Minimum distance for swipe

        if (deltaX > threshold) {
          // Right swipe - open sidebar
          if (!mobileOpen) {
            setMobileOpen(true)
          }
        } else if (deltaX < -threshold) {
          // Left swipe - close sidebar
          if (mobileOpen) {
            setMobileOpen(false)
          }
        }
      }

      // Reset touch references
      touchStartRef.current = null
      touchEndRef.current = null
    }

    // Add event listeners to document for edge swipe detection
    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: true })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isMobile, mobileOpen, setMobileOpen])

  // Handle escape key to close mobile sidebar
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileOpen) {
        setMobileOpen(false)
      }
    }

    if (isMobile) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isMobile, mobileOpen, setMobileOpen])

  // Handle click outside to close mobile sidebar
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node) && mobileOpen) {
        setMobileOpen(false)
      }
    }

    if (isMobile && mobileOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMobile, mobileOpen, setMobileOpen])



  const sidebarContent = (
    <div 
      ref={sidebarRef}
      style={{ width: sidebarWidth }}
      className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white dark:bg-[#23408e] border-r border-gray-200 dark:border-[#2d437a] z-40 flex flex-col overflow-hidden sidebar-transition ${
        isMobile 
          ? `sidebar-mobile-slide ${mobileOpen ? 'open' : ''}` 
          : ''
      } ${className}`}
    >
      {/* Header with toggle button */}
      <div className="flex items-center justify-between h-16 border-b border-gray-200 dark:border-[#2d437a] px-4">
        <h1 className={`font-semibold text-gray-900 dark:text-gray-100 transition-opacity duration-200 ${
          collapsed && !isMobile ? 'opacity-0 lg:hidden' : 'opacity-100'
        }`}>
          {title}
        </h1>
        
        {/* Toggle button - only show on desktop */}
        {!isMobile && (
          <button
            onClick={toggleCollapsed}
            className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors duration-200"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRightIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            ) : (
              <ChevronLeftIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            )}
          </button>
        )}
      </div>
      
      {/* Navigation Items */}
      <nav className="flex-1 px-2 py-4 space-y-2 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive = activeItem === item.id
          
          return (
            <button
              key={item.id}
              onClick={() => onItemClick(item.id)}
              className={`w-full flex items-center px-2 py-3 rounded-lg transition-colors duration-200 group ${
                isActive
                  ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
              aria-label={item.name}
            >
              <Icon className="h-6 w-6 flex-shrink-0" />
              <span className={`ml-3 text-sm font-medium transition-opacity duration-200 ${
                collapsed && !isMobile ? 'opacity-0 lg:hidden' : 'opacity-100'
              }`}>
                {item.name}
              </span>
            </button>
          )
        })}
      </nav>

      {/* Quick Actions */}
      {quickActions.length > 0 && (
        <div className="border-t border-gray-200 dark:border-[#2d437a] p-2">
          <div className="space-y-1">
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={action.onClick}
                disabled={action.disabled}
                className={`w-full flex items-center px-2 py-2 rounded-lg transition-all duration-200 quick-action-button group ${
                  action.disabled
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
                } ${
                  action.variant === 'danger' 
                    ? 'text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300'
                    : action.variant === 'secondary'
                    ? 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                    : 'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300'
                }`}
                aria-label={action.label}
              >
                <action.icon className="h-5 w-5 flex-shrink-0" />
                <span className={`ml-3 text-sm font-medium transition-opacity duration-200 ${
                  collapsed && !isMobile ? 'opacity-0 lg:hidden' : 'opacity-100'
                }`}>
                  {action.label}
                </span>
                {action.badge && (
                  <span className={`ml-auto px-2 py-0.5 text-xs font-medium rounded-full transition-opacity duration-200 ${
                    collapsed && !isMobile ? 'opacity-0 lg:hidden' : 'opacity-100'
                  } ${
                    action.variant === 'danger'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  }`}>
                    {action.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  // Mobile overlay
  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        {mobileOpen && (
          <div 
            className="sidebar-mobile-overlay"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        )}
        {sidebarContent}
      </>
    )
  }

  return sidebarContent
}
