'use client'

import React from 'react'
import Image from 'next/image'
import { ListBulletIcon, CloudArrowUpIcon, CheckCircleIcon, LockClosedIcon } from '@heroicons/react/24/outline'

export interface AdditionalOptionsCardProps {
  isClosed: boolean
  incidentType: string
  onIsClosedChange: (value: boolean) => void
  shouldAutoClose: (incidentType: string) => boolean
  getAutoCloseReason: (incidentType: string) => string
  photoPreviewUrl: string | null
  photoError: string | null
  onPhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export default function AdditionalOptionsCard({
  isClosed,
  incidentType,
  onIsClosedChange,
  shouldAutoClose,
  getAutoCloseReason,
  photoPreviewUrl,
  photoError,
  onPhotoChange,
}: AdditionalOptionsCardProps) {
  
  const isAutoClosed = isClosed && incidentType && shouldAutoClose(incidentType);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      
      {/* Header */}
      <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
        <div className="bg-gray-100 p-1.5 rounded-md text-gray-600">
          <ListBulletIcon className="h-4 w-4" />
        </div>
        <h3 id="additional-options-title" className="font-semibold text-slate-800 text-sm">Options</h3>
      </div>

      <div className="p-5 space-y-5">
        
        {/* Status Toggle */}
        <div>
          <label 
            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
              isClosed 
                ? 'bg-blue-50 border-blue-200' 
                : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-1.5 rounded-full ${isClosed ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                {isClosed ? <LockClosedIcon className="h-4 w-4" /> : <CheckCircleIcon className="h-4 w-4" />}
              </div>
              <div>
                <p className={`text-sm font-semibold ${isClosed ? 'text-blue-900' : 'text-slate-700'}`}>
                  Mark as Closed
                </p>
                <p className="text-[10px] text-slate-500">
                  {isClosed ? 'Incident will be archived immediately' : 'Incident remains open for updates'}
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isClosed}
              onChange={(e) => onIsClosedChange(e.target.checked)}
              className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 transition-all"
            />
          </label>

          {/* Auto-close Notice */}
          {isAutoClosed && (
            <div className="mt-2 mx-1 flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 px-3 py-2 rounded-md border border-emerald-100">
              <CheckCircleIcon className="h-4 w-4 shrink-0" />
              <span>
                <strong>Auto-Closing:</strong> {getAutoCloseReason(incidentType)}
              </span>
            </div>
          )}
        </div>

        <div className="h-px bg-slate-100" />

        {/* Photo Upload */}
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">
            Evidence / Attachment
          </label>
          
          <div className="relative group">
            <input
              id="photo-upload"
              type="file"
              accept="image/jpeg,image/png,image/jpg,image/heic"
              onChange={onPhotoChange}
              className="hidden"
            />
            <label 
              htmlFor="photo-upload" 
              className={`
                flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
                ${photoPreviewUrl ? 'border-blue-300 bg-blue-50/30' : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50'}
              `}
            >
              {photoPreviewUrl ? (
                <div className="relative w-full flex flex-col items-center gap-3">
                  <div className="relative h-24 w-24 rounded-lg overflow-hidden shadow-md border border-white ring-2 ring-blue-100">
                    <Image
                      src={photoPreviewUrl}
                      alt="Selected preview"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-blue-700">Image Selected</p>
                    <p className="text-[10px] text-blue-500">Click to change</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-slate-100 p-3 rounded-full mb-3 group-hover:scale-110 transition-transform">
                    <CloudArrowUpIcon className="h-6 w-6 text-slate-400 group-hover:text-blue-500" />
                  </div>
                  <p className="text-sm font-medium text-slate-700">Click to upload photo</p>
                  <p className="text-xs text-slate-400 mt-1">JPG, PNG up to 5MB</p>
                </>
              )}
            </label>
          </div>
          
          {photoError && (
            <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-red-500" />
              {photoError}
            </p>
          )}
        </div>

      </div>
    </div>
  )
}