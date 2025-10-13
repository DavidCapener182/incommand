// src/hooks/useBulkSelection.ts
'use client'

import { useState, useCallback, useMemo } from 'react'

export interface BulkSelectionOptions {
  onSelectionChange?: (selectedIds: Set<number>) => void
  maxSelection?: number
}

/**
 * Hook for managing bulk selection of items
 * Supports keyboard navigation and multi-select
 */
export function useBulkSelection(options: BulkSelectionOptions = {}) {
  const { onSelectionChange, maxSelection } = options
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [lastSelectedId, setLastSelectedId] = useState<number | null>(null)

  // Select/deselect a single item
  const toggleSelection = useCallback((id: number, shiftKey = false, allIds: number[] = []) => {
    setSelectedIds(prev => {
      const newSelection = new Set(prev)

      if (shiftKey && lastSelectedId !== null && allIds.length > 0) {
        // Shift+click: select range
        const lastIndex = allIds.indexOf(lastSelectedId)
        const currentIndex = allIds.indexOf(id)
        
        if (lastIndex !== -1 && currentIndex !== -1) {
          const start = Math.min(lastIndex, currentIndex)
          const end = Math.max(lastIndex, currentIndex)
          
          for (let i = start; i <= end; i++) {
            if (maxSelection && newSelection.size >= maxSelection && !newSelection.has(allIds[i])) {
              break
            }
            newSelection.add(allIds[i])
          }
        }
      } else {
        // Regular click: toggle single item
        if (newSelection.has(id)) {
          newSelection.delete(id)
        } else {
          if (!maxSelection || newSelection.size < maxSelection) {
            newSelection.add(id)
            setLastSelectedId(id)
          }
        }
      }

      onSelectionChange?.(newSelection)
      return newSelection
    })
  }, [lastSelectedId, maxSelection, onSelectionChange])

  // Select all items
  const selectAll = useCallback((ids: number[]) => {
    const newSelection = new Set(maxSelection ? ids.slice(0, maxSelection) : ids)
    setSelectedIds(newSelection)
    onSelectionChange?.(newSelection)
  }, [maxSelection, onSelectionChange])

  // Deselect all items
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
    setLastSelectedId(null)
    onSelectionChange?.(new Set())
  }, [onSelectionChange])

  // Check if an item is selected
  const isSelected = useCallback((id: number) => {
    return selectedIds.has(id)
  }, [selectedIds])

  // Check if all items are selected
  const isAllSelected = useCallback((totalCount: number) => {
    return selectedIds.size === totalCount && totalCount > 0
  }, [selectedIds])

  // Check if some (but not all) items are selected
  const isIndeterminate = useCallback((totalCount: number) => {
    return selectedIds.size > 0 && selectedIds.size < totalCount
  }, [selectedIds])

  // Get selected count
  const selectedCount = useMemo(() => selectedIds.size, [selectedIds])

  // Get selected IDs as array
  const selectedIdsArray = useMemo(() => Array.from(selectedIds), [selectedIds])

  return {
    selectedIds,
    selectedIdsArray,
    selectedCount,
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
    isAllSelected,
    isIndeterminate
  }
}

