/**
 * Photo Upload API Endpoint
 * Handles photo uploads for incidents with Supabase Storage
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabaseServer'

const supabase = getServiceClient()

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const incidentId = formData.get('incidentId') as string
    const timestamp = formData.get('timestamp') as string
    const latitude = formData.get('latitude') as string
    const longitude = formData.get('longitude') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!incidentId) {
      return NextResponse.json(
        { error: 'Incident ID is required' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${incidentId}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('incident-photos')
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload photo', details: uploadError.message },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('incident-photos')
      .getPublicUrl(fileName)

    // Store photo metadata in database
    const { data: photoRecord, error: dbError } = await supabase
      .from('incident_photos')
      .insert({
        incident_id: incidentId,
        photo_url: urlData.publicUrl,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        captured_at: timestamp || new Date().toISOString(),
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        uploaded_at: new Date().toISOString()
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      // Photo uploaded but metadata insert failed - still return success with URL
      return NextResponse.json({
        success: true,
        url: urlData.publicUrl,
        fileName,
        warning: 'Photo uploaded but metadata storage failed'
      })
    }

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      fileName,
      photoId: photoRecord.id
    })

  } catch (error: any) {
    console.error('Photo upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// Config moved to route segment config in Next.js App Router
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
