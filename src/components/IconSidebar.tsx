'use client'

import React from 'react'

interface NavigationItem {
  name: string
  icon: React.ComponentType<{ className?: string }>
  id: string
}

interface IconSidebarProps {
  navigation: NavigationItem[]
  activeItem: string
  onItemClick: (id: string) => void
  title: string
}

export default function IconSidebar({ navigation, activeItem, onItemClick, title }: IconSidebarProps) {
  return (
    <div className="fixed left-0 top-0 h-full w-16 lg:w-64 bg-white dark:bg-[#23408e] border-r border-gray-200 dark:border-[#2d437a] z-50 flex flex-col">
      {/* Title */}
      <div className="hidden lg:flex items-center justify-center h-16 border-b border-gray-200 dark:border-[#2d437a]">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h1>
      </div>
      
      {/* Navigation Items */}
      <nav className="flex-1 px-2 py-4 space-y-2">
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
            >
              <Icon className="h-6 w-6 flex-shrink-0" />
              <span className="hidden lg:block ml-3 text-sm font-medium">{item.name}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
