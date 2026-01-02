/**
 * File Sharing System
 * Secure document and media sharing for teams
 */

import { supabase } from '@/lib/supabase'

export interface SharedFile {
  id: string
  name: string
  type: string
  size: number
  url: string
  thumbnail?: string
  uploadedBy: string
  uploadedByCallsign: string
  eventId?: string
  incidentId?: string
  channelId?: string
  description?: string
  tags: string[]
  sharedWith: string[] // User IDs
  expiresAt?: string
  downloadCount: number
  createdAt: string
  isPublic: boolean
}

export interface FileUploadOptions {
  file: File
  eventId?: string
  incidentId?: string
  channelId?: string
  description?: string
  tags?: string[]
  sharedWith?: string[]
  expiresIn?: number // days
  isPublic?: boolean
}

export interface FileUploadProgress {
  fileName: string
  loaded: number
  total: number
  percentage: number
  status: 'uploading' | 'processing' | 'complete' | 'error'
  error?: string
}

export class FileSharing {
  /**
   * Upload file
   */
  async uploadFile(
    options: FileUploadOptions,
    userId: string,
    userCallsign: string,
    onProgress?: (progress: FileUploadProgress) => void
  ): Promise<SharedFile | null> {
    const { file, eventId, incidentId, channelId, description, tags = [], sharedWith = [], expiresIn, isPublic = false } = options
    const client = supabase as any

    try {
      // Validate file
      if (file.size > 100 * 1024 * 1024) { // 100MB limit
        throw new Error('File size must be less than 100MB')
      }

      // Update progress
      onProgress?.({
        fileName: file.name,
        loaded: 0,
        total: file.size,
        percentage: 0,
        status: 'uploading'
      })

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`
      const filePath = `${eventId || 'general'}/${fileName}`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await client.storage
        .from('shared-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      onProgress?.({
        fileName: file.name,
        loaded: file.size,
        total: file.size,
        percentage: 100,
        status: 'processing'
      })

      // Get public URL
      const { data: urlData } = client.storage
        .from('shared-files')
        .getPublicUrl(filePath)

      // Generate thumbnail for images
      let thumbnailUrl: string | undefined
      if (file.type.startsWith('image/')) {
        thumbnailUrl = await this.generateThumbnail(file)
      }

      // Calculate expiration
      const expiresAt = expiresIn
        ? new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000).toISOString()
        : undefined

      // Store metadata in database
      const { data: fileRecord, error: dbError } = await client
        .from('shared_files')
        .insert({
          name: file.name,
          type: file.type,
          size: file.size,
          url: urlData.publicUrl,
          thumbnail: thumbnailUrl,
          uploaded_by: userId,
          uploaded_by_callsign: userCallsign,
          event_id: eventId,
          incident_id: incidentId,
          channel_id: channelId,
          description,
          tags,
          shared_with: sharedWith,
          expires_at: expiresAt,
          is_public: isPublic,
          download_count: 0,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (dbError) throw dbError

      onProgress?.({
        fileName: file.name,
        loaded: file.size,
        total: file.size,
        percentage: 100,
        status: 'complete'
      })

      return fileRecord as unknown as SharedFile
    } catch (error: any) {
      console.error('File upload error:', error)
      
      onProgress?.({
        fileName: file.name,
        loaded: 0,
        total: file.size,
        percentage: 0,
        status: 'error',
        error: error.message
      })

      return null
    }
  }

  /**
   * Download file
   */
  async downloadFile(fileId: string, userId: string): Promise<void> {
    const client = supabase as any
    try {
      // Get file metadata
      const { data: file, error } = await client
        .from('shared_files')
        .select('*')
        .eq('id', fileId)
        .single()

      if (error) throw error

      // Check permissions
      if (!file.is_public && !file.shared_with?.includes(userId)) {
        throw new Error('Access denied')
      }

      // Increment download count
      await client
        .from('shared_files')
        .update({ download_count: (file.download_count || 0) + 1 })
        .eq('id', fileId)

      // Trigger download
      window.open(file.url, '_blank')
    } catch (error) {
      console.error('Download error:', error)
      throw error
    }
  }

  /**
   * Delete file
   */
  async deleteFile(fileId: string, userId: string): Promise<boolean> {
    const client = supabase as any
    try {
      // Get file
      const { data: file, error: fetchError } = await client
        .from('shared_files')
        .select('*')
        .eq('id', fileId)
        .single()

      if (fetchError) throw fetchError

      // Check if user is owner
      if (file.uploaded_by !== userId) {
        throw new Error('Only the file owner can delete this file')
      }

      // Delete from storage
      const filePath = file.url.split('/shared-files/')[1]
      await client.storage
        .from('shared-files')
        .remove([filePath])

      // Delete from database
      const { error: deleteError } = await client
        .from('shared_files')
        .delete()
        .eq('id', fileId)

      if (deleteError) throw deleteError

      return true
    } catch (error) {
      console.error('Delete error:', error)
      return false
    }
  }

  /**
   * Get files for event/incident/channel
   */
  async getFiles(filters: {
    eventId?: string
    incidentId?: string
    channelId?: string
    userId?: string
  }): Promise<SharedFile[]> {
    const client = supabase as any
    try {
      let query = client
        .from('shared_files')
        .select('*')
        .order('created_at', { ascending: false })

      if (filters.eventId) query = query.eq('event_id', filters.eventId)
      if (filters.incidentId) query = query.eq('incident_id', filters.incidentId)
      if (filters.channelId) query = query.eq('channel_id', filters.channelId)

      const { data, error } = await query

      if (error) throw error

      // Filter by permissions
      let files = data as unknown as SharedFile[]
      if (filters.userId) {
        files = files.filter(file =>
          file.isPublic ||
          file.uploadedBy === filters.userId ||
          filters.userId && file.sharedWith.includes(filters.userId)
        )
      }

      return files
    } catch (error) {
      console.error('Error fetching files:', error)
      return []
    }
  }

  /**
   * Generate thumbnail for images
   */
  private async generateThumbnail(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        const img = new Image()
        
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const maxSize = 200
          let { width, height } = img

          if (width > height) {
            if (width > maxSize) {
              height = (height / width) * maxSize
              width = maxSize
            }
          } else {
            if (height > maxSize) {
              width = (width / height) * maxSize
              height = maxSize
            }
          }

          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0, width, height)

          resolve(canvas.toDataURL('image/jpeg', 0.7))
        }

        img.onerror = reject
        img.src = e.target?.result as string
      }

      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }
}

// Export singleton instance
export const fileSharing = new FileSharing()
