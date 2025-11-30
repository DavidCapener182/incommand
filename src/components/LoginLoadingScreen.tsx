'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function LoginLoadingScreen() {
  const [isVisible, setIsVisible] = useState(false)
  const [currentText, setCurrentText] = useState('InCommand')
  const [isFadingOut, setIsFadingOut] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading } = useAuth()
  const hasShownRef = useRef(false)
  const animationStartedRef = useRef(false)

  useEffect(() => {
    // Only show on authenticated routes (not login/signup pages)
    const authRoutes = ['/login', '/signup', '/', '/features', '/pricing', '/about', '/privacy', '/terms']
    if (authRoutes.includes(pathname || '')) {
      return
    }

    // Only show if user is authenticated and not loading
    if (loading || !user) {
      return
    }

    // Check if we should show the loading screen
    // Either flag is set during login, or user just landed on authenticated page
    const showFlag = typeof window !== 'undefined' && 
                     window.sessionStorage?.getItem('showLoginLoadingScreen') === 'true'
    
    // Also check if user came from login page (check referrer)
    const cameFromLogin = typeof document !== 'undefined' && 
                          document.referrer.includes('/login')
    
    // Check if we've already shown it this session
    const alreadyShown = typeof window !== 'undefined' && 
                         window.sessionStorage?.getItem('loginLoadingScreenShown') === 'true'
    
    const shouldShow = (showFlag || cameFromLogin) && 
                       !alreadyShown &&
                       !hasShownRef.current && 
                       !animationStartedRef.current

    if (shouldShow) {
      hasShownRef.current = true
      animationStartedRef.current = true
      setIsVisible(true)
      // Clear the flag and mark as shown
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.removeItem('showLoginLoadingScreen')
        sessionStorage.setItem('loginLoadingScreenShown', 'true')
      }

      // Start the animation sequence
      const sequence = [
        'InEvents',
        'InStadiums',
        'InFestivals',
        'InControl',
        'InCommand'
      ]

      let currentIndex = 0

      // Wait for initial animation to finish (2s delay + 1s reveal + 2s hold = 5s)
      const startCycleDelay = 5000

      // Note: Removed router.refresh() calls as they were causing infinite render loops
      // The page will load naturally in the background while the overlay is showing

      setTimeout(() => {
        const cycleInterval = setInterval(() => {
          if (currentIndex < sequence.length) {
            setCurrentText(sequence[currentIndex])
            currentIndex++

            // Check if we reached the end
            if (currentIndex >= sequence.length) {
              clearInterval(cycleInterval)

              // Fade out after 2 seconds
              setTimeout(() => {
                setIsFadingOut(true)
                setTimeout(() => {
                  setIsVisible(false)
                }, 1000) // Match CSS transition duration
              }, 2000)
            }
          }
        }, 2000) // Change every 2 seconds
      }, startCycleDelay)
    }
  }, [router, pathname, user, loading])

  // Don't render at all when not visible to avoid blocking navigation
  if (!isVisible) return null

  return (
    <>
      <style jsx>{`
        @keyframes drawCircle {
          0% {
            stroke-dashoffset: 283;
            transform: rotate(-90deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          100% {
            stroke-dashoffset: 0;
            transform: rotate(0deg);
            opacity: 1;
          }
        }

        @keyframes drawTick {
          0% {
            stroke-dashoffset: 200;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }

        @keyframes revealText {
          0% {
            width: 0;
          }
          100% {
            width: 11.5em;
          }
        }

        .loading-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: #283593;
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
          transition: opacity 1s ease-out, visibility 1s linear;
          pointer-events: auto;
        }
        
        /* Ensure page content loads behind the overlay */
        body:has(.loading-overlay:not(.fade-out)) {
          overflow: hidden;
        }

        .loading-overlay.fade-out {
          opacity: 0;
          visibility: hidden;
          pointer-events: none !important;
          display: none !important;
        }

        .logo-wrapper {
          font-size: min(7.5vw, 75px);
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
        }

        .container {
          position: relative;
          display: flex;
          align-items: center;
          height: 1.5em;
          max-width: 98vw;
          padding-left: 0.3em;
        }

        .icon-svg {
          width: 1em;
          height: 1em;
          flex-shrink: 0;
          z-index: 10;
          margin-right: 0.2em;
        }

        .circle {
          fill: none;
          stroke: white;
          stroke-width: 6;
          stroke-linecap: round;
          stroke-dasharray: 283;
          stroke-dashoffset: 283;
          transform-origin: center;
          animation: drawCircle 0.8s ease-out forwards;
        }

        .tick {
          fill: none;
          stroke: #ed1c24;
          stroke-width: 10;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-dasharray: 200;
          stroke-dashoffset: 200;
          animation: drawTick 0.5s ease-out 0.6s forwards;
        }

        .text-mask {
          overflow: hidden;
          width: 0;
          height: 100%;
          display: flex;
          align-items: center;
          animation: revealText 1s cubic-bezier(0.2, 0.8, 0.2, 1) 2s forwards;
        }

        .text {
          color: white;
          font-size: 1em;
          font-weight: 700;
          white-space: nowrap;
          line-height: 1;
          padding-left: 0.2em;
          transition: opacity 0.3s ease;
          font-family: 'Montserrat', sans-serif;
        }
      `}</style>
      <div className={`loading-overlay ${isFadingOut ? 'fade-out' : ''}`}>
        <div className="logo-wrapper">
          <div className="container">
            <svg className="icon-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="45" className="circle" />
              <path d="M20 55 L45 75 L85 20" className="tick" />
            </svg>
            <div className="text-mask">
              <div className="text">{currentText}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

