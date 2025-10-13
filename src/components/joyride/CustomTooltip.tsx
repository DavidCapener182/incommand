'use client'

import React from 'react'
import type { TooltipRenderProps } from 'react-joyride'
import { motion } from 'framer-motion'

export default function CustomTooltip({
  backProps,
  closeProps,
  primaryProps,
  skipProps,
  tooltipProps,
  step,
  index,
  size,
  isLastStep,
}: TooltipRenderProps) {
  const learnMoreHref = (step as any)?.data?.href as string | undefined

  return (
    <motion.div
      {...tooltipProps}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="max-w-sm md:max-w-md rounded-2xl shadow-xl border border-gray-200/60 dark:border-[#2d437a]/50 overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(10px)' }}
      role="dialog"
      aria-live="polite"
    >
      <div className="bg-gradient-to-r from-blue-600/10 to-indigo-600/10 px-4 py-3">
        <div className="text-xs text-gray-600">Step {index + 1} of {size}</div>
        {step.title && (
          <h3 className="text-base font-semibold text-gray-900 mt-1">{step.title}</h3>
        )}
      </div>
      <div className="px-4 py-3 text-sm text-gray-800">
        {typeof step.content === 'string' ? (
          <p className="leading-relaxed">{step.content}</p>
        ) : step.content}
        {learnMoreHref && (
          <a
            href={learnMoreHref}
            className="inline-block mt-2 text-blue-600 hover:underline"
          >
            Learn more
          </a>
        )}
      </div>
      <div className="px-4 py-3 bg-white/70 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            {...skipProps}
            className="px-3 py-1.5 text-xs rounded-lg text-gray-600 hover:bg-gray-100"
          >
            Skip
          </button>
          {index > 0 && (
            <button
              {...backProps}
              className="px-3 py-1.5 text-xs rounded-lg text-gray-700 hover:bg-gray-100"
            >
              Back
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            {...closeProps}
            className="px-3 py-1.5 text-xs rounded-lg text-gray-700 hover:bg-gray-100"
          >
            Close
          </button>
          <button
            {...primaryProps}
            className="px-3 py-1.5 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            {isLastStep ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </motion.div>
  )
}


