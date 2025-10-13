'use client'

import React from 'react'
import Image from 'next/image'

export default function Screenshot({ src, alt, caption }: { src: string; alt: string; caption?: string }) {
  return (
    <figure className="mt-3">
      <div className="relative w-full max-w-full overflow-hidden rounded-xl border border-gray-200 dark:border-[#2d437a]">
        <Image src={src} alt={alt} width={1200} height={675} sizes="(max-width: 768px) 100vw, 800px" style={{ width: '100%', height: 'auto' }} />
      </div>
      {caption && <figcaption className="text-xs text-gray-500 mt-1">{caption}</figcaption>}
    </figure>
  )
}


