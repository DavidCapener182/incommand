'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

interface SupportToolModalProps {
  title: string
  currentTab: React.ReactNode
  setupTab: React.ReactNode
  isOpen: boolean
  onClose: () => void
  onSave?: () => void
  lastUpdated?: string
  currentTabLabel?: string
  setupTabLabel?: string
}

export default function SupportToolModal({
  title,
  currentTab,
  setupTab,
  isOpen,
  onClose,
  onSave,
  lastUpdated,
  currentTabLabel = "Current",
  setupTabLabel = "Setup",
}: SupportToolModalProps) {
  const [isSaving, setIsSaving] = React.useState(false)

  React.useEffect(() => {
    console.log(`SupportToolModal "${title}" isOpen:`, isOpen)
  }, [isOpen, title])

  const handleSave = async () => {
    if (onSave) {
      setIsSaving(true)
      try {
        await onSave()
      } finally {
        setIsSaving(false)
      }
    }
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose()
      }
    }}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">{title}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="current" className="flex flex-col h-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="current">{currentTabLabel}</TabsTrigger>
              <TabsTrigger value="setup">{setupTabLabel}</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto mt-4">
              <TabsContent value="current" className="mt-0">
                {currentTab}
              </TabsContent>
              <TabsContent value="setup" className="mt-0">
                {setupTab}
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <DialogFooter className="flex items-center justify-between gap-4 mt-4 border-t pt-4">
          <div className="text-xs text-muted-foreground">
            {lastUpdated && `Last Updated: ${lastUpdated}`}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            {onSave && (
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

