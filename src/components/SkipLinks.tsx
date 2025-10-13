// src/components/SkipLinks.tsx
'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface SkipLink {
  id: string
  label: string
  targetId: string
}

const defaultSkipLinks: SkipLink[] = [
  { id: 'skip-to-main', label: 'Skip to main content', targetId: 'main-content' },
  { id: 'skip-to-nav', label: 'Skip to navigation', targetId: 'main-navigation' },
  { id: 'skip-to-search', label: 'Skip to search', targetId: 'search-input' },
  { id: 'skip-to-incidents', label: 'Skip to incidents', targetId: 'incidents-table' },
]

interface SkipLinksProps {
  links?: SkipLink[]
}

/**
 * Skip links for keyboard navigation
 * Allows users to quickly jump to important sections
 * Meets WCAG 2.1 Success Criterion 2.4.1 (Bypass Blocks)
 */
export default function SkipLinks({ links = defaultSkipLinks }: SkipLinksProps) {
  const handleSkipToSection = (targetId: string) => {
    const target = document.getElementById(targetId)
    if (target) {
      target.focus()
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="skip-links" role="navigation" aria-label="Skip links">
      {links.map((link) => (
        <motion.a
          key={link.id}
          href={`#${link.targetId}`}
          onClick={(e) => {
            e.preventDefault()
            handleSkipToSection(link.targetId)
          }}
          className="skip-link"
          initial={{ opacity: 0 }}
          whileFocus={{ opacity: 1 }}
          tabIndex={0}
        >
          {link.label}
        </motion.a>
      ))}

      <style jsx>{`
        .skip-links {
          position: absolute;
          top: 0;
          left: 0;
          z-index: 9999;
        }

        .skip-link {
          position: absolute;
          top: -100px;
          left: 0;
          background: #1e40af;
          color: white;
          padding: 0.75rem 1.5rem;
          text-decoration: none;
          font-weight: 600;
          border-radius: 0 0 0.375rem 0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          transition: top 0.3s ease;
          z-index: 9999;
        }

        .skip-link:focus {
          top: 0;
          outline: 2px solid #fbbf24;
          outline-offset: 2px;
        }

        .skip-link:hover {
          background: #1e3a8a;
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .skip-link {
            background: #3b82f6;
            color: white;
          }

          .skip-link:hover {
            background: #2563eb;
          }
        }
      `}</style>
    </div>
  )
}

