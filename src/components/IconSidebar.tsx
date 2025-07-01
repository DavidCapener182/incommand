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
    if (onItemClick) {
      onItemClick(item.id);
    }
    // On mobile, collapse the sidebar after clicking
    if (window.innerWidth < 1024) {
      setIsExpanded(false);
    }
  };

  return (
    <>
      {/* Mobile: Icon-only sidebar that can expand */}
      <aside className={`
        lg:hidden
        fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white dark:bg-[#23408e] border-r border-gray-200 dark:border-[#2d437a] 
        transition-all duration-300 ease-in-out z-50 shadow-lg
        ${isExpanded ? 'w-64' : 'w-16'}
        ${className}
      `}>
        {/* Mobile Header */}
        <div className="p-4 border-b border-gray-200 dark:border-[#2d437a]">
          <div className="flex items-center justify-between">
            <div className={`flex items-center space-x-2 transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">{title}</span>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="flex-1 p-2 space-y-2">
          {navigation.map(item => {
            const active = activeItem === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                onMouseEnter={() => setIsExpanded(true)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium transition-all duration-200
                  ${active ? 'bg-blue-50 dark:bg-[#1a2a57] text-blue-700 dark:text-blue-200' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#1a2a57]'}
                `}
              >
                <item.icon className={`h-6 w-6 min-w-[24px] ${active ? 'text-blue-700 dark:text-blue-200' : 'text-gray-400 dark:text-blue-300'}`} />
                <span className={`transition-all duration-300 whitespace-nowrap ${isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'} overflow-hidden`}>
                  {item.name}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Overlay toggle area for expanding */}
        <div 
          className="absolute inset-0 z-10"
          onClick={() => setIsExpanded(!isExpanded)}
          onMouseLeave={() => setIsExpanded(false)}
        />
      </aside>

      {/* Desktop: Full traditional sidebar (original design) */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:bg-white lg:dark:bg-[#23408e] lg:border-r lg:border-gray-200 lg:dark:border-[#2d437a] lg:shadow-lg">
        {/* Desktop Header */}
        <div className="p-4 border-b border-gray-200 dark:border-[#2d437a] bg-white dark:bg-[#23408e]">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-semibold text-gray-900 dark:text-white">{title}</span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="flex-1 space-y-2 py-4 px-2">
          {navigation.map(item => {
            const active = activeItem === item.id;
            return item.href ? (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-base font-medium transition-colors
                  ${active ? 'bg-blue-50 dark:bg-[#1a2a57] text-blue-700 dark:text-blue-200' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#1a2a57]'}
                `}
              >
                <item.icon className={`h-5 w-5 ${active ? 'text-blue-700 dark:text-blue-200' : 'text-gray-400 dark:text-blue-300'}`} />
                {item.name}
              </Link>
            ) : (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-base font-medium transition-colors w-full text-left
                  ${active ? 'bg-blue-50 dark:bg-[#1a2a57] text-blue-700 dark:text-blue-200' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#1a2a57]'}
                `}
              >
                <item.icon className={`h-5 w-5 ${active ? 'text-blue-700 dark:text-blue-200' : 'text-gray-400 dark:text-blue-300'}`} />
                {item.name}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Mobile backdrop */}
      {isExpanded && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-25 z-40"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </>
  );
} 