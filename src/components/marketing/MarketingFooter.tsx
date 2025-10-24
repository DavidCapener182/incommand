import Link from 'next/link'
import { SocialLinks } from './SocialLinks'

export const MarketingFooter = () => {
  return (
    <footer className="bg-blue-900 text-blue-100 py-10 text-center text-sm border-t border-blue-800/60">
      <div className="flex flex-col items-center gap-6">
        <SocialLinks textClassName="text-blue-100" iconClassName="border-white/30" />
        <div className="flex flex-wrap justify-center gap-4 text-xs text-blue-200">
          <Link href="/privacy" className="hover:underline">
            Privacy Policy
          </Link>
          <span className="hidden sm:inline">|</span>
          <Link href="/terms" className="hover:underline">
            Terms of Use
          </Link>
        </div>
        <p className="text-blue-300 text-xs">
          © {new Date().getFullYear()} InCommand. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
