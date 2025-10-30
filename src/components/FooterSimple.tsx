"use client"

import { motion } from "framer-motion"
import Image from 'next/image'
import React from 'react'

interface FooterSimpleProps {
  companyName?: string
  description?: string
  links?: {
    product?: Array<{ name: string; url: string }>
    company?: Array<{ name: string; url: string }>
    support?: Array<{ name: string; url: string }>
  }
  social?: {
    twitter?: string
    linkedin?: string
    github?: string
    discord?: string
  }
  copyright?: string
}

export function FooterSimple({
  companyName = "InCommand",
  description = "Professional event management and incident response platform for festivals, venues, and public events.",
  links = {
    product: [
      { name: "Features", url: "/features" },
      { name: "Pricing", url: "/pricing" },
      { name: "Documentation", url: "/help" },
      { name: "API", url: "/help" },
    ],
    company: [
      { name: "About", url: "/about" },
      { name: "Blog", url: "/blog" },
      { name: "Careers", url: "/careers" },
      { name: "Contact", url: "mailto:info@incommand.uk" },
    ],
    support: [
      { name: "Help Center", url: "/help" },
      { name: "Community", url: "/messages" },
      { name: "Status", url: "/status" },
      { name: "Security", url: "/settings/support" },
    ],
  },
  social = {
    twitter: "https://twitter.com/incommanduk",
    linkedin: "https://linkedin.com/company/incommand-uk",
    github: "https://github.com/incommand",
  },
  copyright = `© ${new Date().getFullYear()} InCommand. All rights reserved.`,
}: FooterSimpleProps) {
  return (
    <footer role="contentinfo" className="border-t border-border bg-background pb-10">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5"
        >
          {/* Company Info */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="flex flex-col items-center text-center"
            >
              <FooterBrandLogo companyName={companyName} />
              <p className="text-foreground/70 mb-6 max-w-md text-sm">
                {description}
              </p>
              
              {/* Contact Info */}
              <div className="mb-6 space-y-2">
                <p className="text-foreground/60 text-sm">
                  <a href="https://www.incommand.uk" target="_blank" rel="noopener noreferrer" className="hover:text-brand transition-colors">
                    www.InCommand.uk
                  </a>
                </p>
                <p className="text-foreground/60 text-sm">
                  <a href="mailto:support@incommand.uk" className="hover:text-brand transition-colors">
                    support@incommand.uk
                  </a>
                </p>
              </div>
            </motion.div>
          </div>

          {/* Links */}
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 lg:col-span-3">
            {links.product && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <h4 className="text-foreground mb-4 text-sm font-semibold uppercase tracking-wide">
                  Product
                </h4>
                <ul className="space-y-3">
                  {links.product.map((link) => (
                    <li key={link.name}>
                      <a
                        href={link.url}
                        className="text-foreground/70 hover:text-brand transition-colors text-sm"
                      >
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {links.company && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
              >
                <h4 className="text-foreground mb-4 text-sm font-semibold uppercase tracking-wide">
                  Company
                </h4>
                <ul className="space-y-3">
                  {links.company.map((link) => (
                    <li key={link.name}>
                      <a
                        href={link.url}
                        className="text-foreground/70 hover:text-brand transition-colors text-sm"
                      >
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {links.support && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
              >
                <h4 className="text-foreground mb-4 text-sm font-semibold uppercase tracking-wide">
                  Support
                </h4>
                <ul className="space-y-3">
                  {links.support.map((link) => (
                    <li key={link.name}>
                      <a
                        href={link.url}
                        className="text-foreground/70 hover:text-brand transition-colors text-sm"
                      >
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Bottom section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          viewport={{ once: true }}
          className="mt-12 border-t border-border pt-8"
        >
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-foreground/70 text-sm">{copyright}</p>
            
            {/* Social Links */}
            <div className="flex items-center gap-4">
              {social.twitter && (
                <a
                  href={social.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground/70 hover:text-brand transition-colors"
                  aria-label="Twitter"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
              )}
              {social.linkedin && (
                <a
                  href={social.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground/70 hover:text-brand transition-colors"
                  aria-label="LinkedIn"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              )}
              {social.github && (
                <a
                  href={social.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground/70 hover:text-brand transition-colors"
                  aria-label="GitHub"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </a>
              )}
              {social.discord && (
                <a
                  href={social.discord}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground/70 hover:text-brand transition-colors"
                  aria-label="Discord"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                </a>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}

function FooterBrandLogo({ companyName }: { companyName: string }) {
  const [error, setError] = React.useState(false)
  const [secondaryTried, setSecondaryTried] = React.useState(false)
  return (
    <div className="mb-4">
      {!error ? (
        <Image
          // Prefer the user-provided blue logo first
          src={secondaryTried ? "/brand/logo-dark.png" : "/InCommandBlue.PNG"}
          alt={companyName}
          width={600}
          height={133}
          className="block h-10 md:h-12 w-auto"
          priority
          onError={() => {
            if (!secondaryTried) {
              setSecondaryTried(true)
            } else {
              setError(true)
            }
          }}
        />
      ) : (
        <h3 className="text-foreground text-2xl font-bold">{companyName}</h3>
      )}
    </div>
  )
}
