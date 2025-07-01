"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavigationItem {
  name: string;
  href?: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  id: string;
  onClick?: () => void;
}

interface IconSidebarProps {
  navigation: NavigationItem[];
  activeItem: string;
  onItemClick?: (id: string) => void;
  title: string;
  className?: string;
}

export default function IconSidebar({ 
  navigation, 
  activeItem, 
  onItemClick, 
  title, 
  className = "" 
}: IconSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();

  const handleItemClick = (item: NavigationItem) => {
    if (item.onClick) {
      item.onClick();
    } else if (onItemClick) {
      onItemClick(item.id);
    }
  };

  return (
    <>
      {/* Mobile Icon Sidebar */}
      <div className={`lg:hidden fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] transition-all duration-300 ${
        isExpanded ? 'w-64' : 'w-16'
      } bg-white dark:bg-[#23408e] border-r border-gray-200 dark:border-[#2d437a] shadow-lg ${className}`}>
        
        {/* Header */}
        <div className="p-3 border-b border-gray-200 dark:border-[#2d437a]">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center gap-3 text-left"
          >
            <div className="w-10 h-10 bg-blue-100 dark:bg-[#1a2a57] rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 dark:text-blue-300 font-bold text-sm">
                {title.charAt(0)}
              </span>
            </div>
            {isExpanded && (
              <span className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {title}
              </span>
            )}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-2 space-y-1">
          {navigation.map((item) => {
            const isActive = activeItem === item.id || 
              (item.href && pathname === item.href) ||
              (item.href && item.href !== '/' && pathname.startsWith(item.href));
            
            const ItemContent = (
              <div className={`
                w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200
                ${isActive 
                  ? 'bg-blue-50 dark:bg-[#1a2a57] text-blue-700 dark:text-blue-200' 
                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#1a2a57]'
                }
              `}>
                <div className="w-5 h-5 flex-shrink-0">
                  <item.icon className={`w-5 h-5 ${
                    isActive 
                      ? 'text-blue-700 dark:text-blue-200' 
                      : 'text-gray-400 dark:text-blue-300'
                  }`} />
                </div>
                {isExpanded && (
                  <span className="text-sm font-medium truncate">
                    {item.name}
                  </span>
                )}
              </div>
            );

            if (item.href) {
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className="block"
                >
                  {ItemContent}
                </Link>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                className="block w-full text-left"
              >
                {ItemContent}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Desktop Sidebar (Hidden on mobile, show normal sidebar on desktop) */}
      <div className="hidden lg:block lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:w-64 lg:bg-white lg:dark:bg-[#23408e] lg:border-r lg:border-gray-200 lg:dark:border-[#2d437a] lg:shadow-lg">
        <div className="p-4 border-b border-gray-200 dark:border-[#2d437a]">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
        </div>
        <nav className="p-4 space-y-2">
          {navigation.map((item) => {
            const isActive = activeItem === item.id || 
              (item.href && pathname === item.href) ||
              (item.href && item.href !== '/' && pathname.startsWith(item.href));
            
            const ItemContent = (
              <div className={`
                flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${isActive 
                  ? 'bg-blue-50 dark:bg-[#1a2a57] text-blue-700 dark:text-blue-200' 
                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#1a2a57]'
                }
              `}>
                <item.icon className={`h-5 w-5 ${
                  isActive 
                    ? 'text-blue-700 dark:text-blue-200' 
                    : 'text-gray-400 dark:text-blue-300'
                }`} />
                {item.name}
              </div>
            );

            if (item.href) {
              return (
                <Link
                  key={item.id}
                  href={item.href}
                >
                  {ItemContent}
                </Link>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                className="w-full text-left"
              >
                {ItemContent}
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
} 