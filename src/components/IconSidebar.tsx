"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarItem {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  id: string;
  href?: string;
  onClick?: () => void;
}

interface IconSidebarProps {
  items: SidebarItem[];
  activeItem: string;
  onItemClick?: (id: string) => void;
  basePath?: string;
}

export default function IconSidebar({ items, activeItem, onItemClick, basePath }: IconSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();

  const handleItemClick = (item: SidebarItem) => {
    if (item.onClick) {
      item.onClick();
    } else if (onItemClick) {
      onItemClick(item.id);
    }
    
    // Auto-collapse on mobile after selection
    if (window.innerWidth < 768) {
      setIsExpanded(false);
    }
  };

  const isItemActive = (item: SidebarItem) => {
    if (item.href && pathname === item.href) return true;
    return activeItem === item.id;
  };

  return (
    <>
      {/* Overlay for mobile when expanded */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed left-0 top-16 bottom-0 z-50 
        transition-all duration-300 ease-in-out
        bg-white dark:bg-[#23408e] border-r border-gray-200 dark:border-[#2d437a]
        shadow-lg
        ${isExpanded ? 'w-64' : 'w-16'}
        md:w-16 md:hover:w-64
      `}>
        <div className="h-full flex flex-col">
          {/* Toggle button for mobile */}
          <div className="p-3 border-b border-gray-200 dark:border-[#2d437a] md:hidden">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1a2a57] transition-colors"
            >
              <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Navigation items */}
          <nav className="flex-1 py-4 space-y-1">
            {items.map((item) => {
              const isActive = isItemActive(item);
              const Component = item.href ? Link : 'button';
              const props = item.href ? { href: item.href } : { onClick: () => handleItemClick(item) };
              
              return (
                <Component
                  key={item.id}
                  {...props}
                  className={`
                    w-full flex items-center gap-3 px-3 py-3 mx-2 rounded-lg 
                    text-left transition-all duration-200
                    ${isActive 
                      ? 'bg-blue-50 dark:bg-[#1a2a57] text-blue-700 dark:text-blue-200' 
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#1a2a57]'
                    }
                    group
                  `}
                >
                  <item.icon className={`
                    h-5 w-5 flex-shrink-0 transition-colors
                    ${isActive 
                      ? 'text-blue-700 dark:text-blue-200' 
                      : 'text-gray-400 dark:text-blue-300 group-hover:text-gray-600 dark:group-hover:text-gray-100'
                    }
                  `} />
                  
                  <span className={`
                    whitespace-nowrap transition-all duration-300
                    ${isExpanded ? 'opacity-100' : 'opacity-0 md:group-hover:opacity-100'}
                    text-sm font-medium
                  `}>
                    {item.name}
                  </span>
                </Component>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
} 