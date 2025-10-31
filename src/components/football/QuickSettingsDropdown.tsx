'use client'

import React, { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Settings, RefreshCw, Download, ExternalLink, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface QuickSettingItem {
  type: 'action' | 'checkbox' | 'separator' | 'label'
  label?: string
  icon?: React.ReactNode
  action?: () => void
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
}

interface QuickSettingsDropdownProps {
  items: QuickSettingItem[]
  toolType: 'stand' | 'staffing' | 'crowd' | 'transport' | 'fixture'
  onOpenModal?: () => void
  className?: string
}

export default function QuickSettingsDropdown({
  items,
  toolType,
  onOpenModal,
  className = ''
}: QuickSettingsDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`h-7 w-7 opacity-60 hover:opacity-100 transition-opacity ${className}`}
          title="Quick Settings"
          type="button"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-56" 
        sideOffset={5}
      >
        {items.map((item, index) => {
          if (item.type === 'separator') {
            return <DropdownMenuSeparator key={index} />
          }

          if (item.type === 'label') {
            return (
              <DropdownMenuLabel key={index}>{item.label}</DropdownMenuLabel>
            )
          }

          if (item.type === 'checkbox') {
            return (
              <DropdownMenuCheckboxItem
                key={index}
                checked={item.checked}
                onCheckedChange={item.onCheckedChange}
                disabled={item.disabled}
              >
                {item.icon && <span className="mr-2">{item.icon}</span>}
                {item.label}
              </DropdownMenuCheckboxItem>
            )
          }

          // action type
          const icon = item.icon || (
            item.label?.toLowerCase().includes('export') ? <Download className="h-4 w-4" /> :
            item.label?.toLowerCase().includes('refresh') ? <RefreshCw className="h-4 w-4" /> :
            item.label?.toLowerCase().includes('settings') ? <ExternalLink className="h-4 w-4" /> :
            item.label?.toLowerCase().includes('reset') ? <RotateCcw className="h-4 w-4" /> :
            null
          )

          return (
            <DropdownMenuItem
              key={index}
              onSelect={() => {
                console.log('Dropdown item selected:', item.label)
                if (item.action) {
                  item.action()
                }
              }}
              disabled={item.disabled}
            >
              {icon && <span className="mr-2">{icon}</span>}
              {item.label}
            </DropdownMenuItem>
          )
        })}

        {/* Always show "View Full Settings" if onOpenModal is provided */}
        {onOpenModal && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onSelect={() => {
                console.log('View Full Settings - onSelect fired')
                if (onOpenModal) {
                  onOpenModal()
                }
              }}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Full Settings
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

