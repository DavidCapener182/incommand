'use client'

import React from 'react'

export default function Screenshot({ src, alt, caption }: { src: string; alt: string; caption?: string }) {
  return (
    <figure className="mt-3">
      <img src={src} alt={alt} className="rounded-xl border border-gray-200 dark:border-[#2d437a]" />
      {caption && <figcaption className="text-xs text-gray-500 mt-1">{caption}</figcaption>}
    </figure>
  )
}


