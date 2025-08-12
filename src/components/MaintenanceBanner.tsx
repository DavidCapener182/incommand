'use client'

import React, { useState, useEffect } from 'react'
import { useMaintenanceMode } from '../hooks/useSystemSettings'
import { useUpdateSystemSettings } from '../hooks/useSystemSettings'
import { useIsAdmin } from '../hooks/useRole'
import { XMarkIcon, ExclamationTriangleIcon, Cog6ToothIcon } from '@heroicons/react/24/outline'

interface MaintenanceBannerProps {
  className?: string
}

export const MaintenanceBanner: React.FC<MaintenanceBannerProps> = ({ className = '' }) => {
  // Safe hooks with fallbacks
  let maintenanceMode;
  try {
    maintenanceMode = useMaintenanceMode();
  } catch (error) {
    console.error('MaintenanceMode hook error:', error);
    maintenanceMode = { isMaintenanceMode: false, maintenanceMessage: '' };
  }
  const { isMaintenanceMode, maintenanceMessage } = maintenanceMode;

  let updateSystemSettings;
  try {
    updateSystemSettings = useUpdateSystemSettings();
  } catch (error) {
    console.error('UpdateSystemSettings hook error:', error);
    updateSystemSettings = { toggleMaintenanceMode: async () => {} };
  }
  const { toggleMaintenanceMode } = updateSystemSettings;

  let isAdmin = false;
  try {
    isAdmin = useIsAdmin();
  } catch (error) {
    console.error('useIsAdmin hook error:', error);
    isAdmin = false;
  }
  const [isVisible, setIsVisible] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [showAdminControls, setShowAdminControls] = useState(false)
  const [customMessage, setCustomMessage] = useState('')

  // Update customMessage when maintenanceMessage changes
  useEffect(() => {
    setCustomMessage(maintenanceMessage)
  }, [maintenanceMessage])

  // Don't render if maintenance mode is not active or banner is dismissed
  if (!isMaintenanceMode || !isVisible) {
    return null
  }

  const handleDisableMaintenance = async () => {
    if (!isAdmin) return
    
    setIsUpdating(true)
    try {
      await toggleMaintenanceMode(false)
    } catch (error) {
      console.error('Failed to disable maintenance mode:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleUpdateMessage = async () => {
    if (!isAdmin) return
    
    setIsUpdating(true)
    try {
      await toggleMaintenanceMode(true, customMessage)
      setShowAdminControls(false)
    } catch (error) {
      console.error('Failed to update maintenance message:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDismiss = () => {
    setIsVisible(false)
    // Re-show after 1 hour
    setTimeout(() => setIsVisible(true), 60 * 60 * 1000)
  }

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 bg-yellow-500 border-b border-yellow-600 shadow-lg transition-all duration-300 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center space-x-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-800 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800">
                {maintenanceMessage}
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                System maintenance in progress. Some features may be temporarily unavailable.
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isAdmin && (
              <button
                onClick={() => setShowAdminControls(!showAdminControls)}
                className="p-1 text-yellow-800 hover:text-yellow-900 transition-colors"
                title="Admin Controls"
              >
                <Cog6ToothIcon className="h-4 w-4" />
              </button>
            )}
            
            <button
              onClick={handleDismiss}
              className="p-1 text-yellow-800 hover:text-yellow-900 transition-colors"
              title="Dismiss (1 hour)"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {/* Admin Controls Panel */}
        {isAdmin && showAdminControls && (
          <div className="border-t border-yellow-600 bg-yellow-400 py-4">
            <div className="space-y-3">
              <div>
                <label htmlFor="maintenance-message" className="block text-sm font-medium text-yellow-800 mb-1">
                  Maintenance Message
                </label>
                <textarea
                  id="maintenance-message"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-yellow-600 rounded-md text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  rows={2}
                  placeholder="Enter maintenance message..."
                />
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleUpdateMessage}
                  disabled={isUpdating}
                  className="px-3 py-1.5 bg-yellow-600 text-white text-sm font-medium rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isUpdating ? 'Updating...' : 'Update Message'}
                </button>
                
                <button
                  onClick={handleDisableMaintenance}
                  disabled={isUpdating}
                  className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isUpdating ? 'Disabling...' : 'Disable Maintenance Mode'}
                </button>
                
                <button
                  onClick={() => setShowAdminControls(false)}
                  className="px-3 py-1.5 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MaintenanceBanner
