import { FaInstagram, FaLinkedinIn, FaTwitter, FaFacebook, FaEnvelope } from 'react-icons/fa'
import { SiTiktok } from 'react-icons/si'
import { cn } from '@/lib/utils'

interface SocialLinksProps {
  className?: string
  iconClassName?: string
  textClassName?: string
  direction?: 'horizontal' | 'vertical'
}

const socialChannels = [
  {
    href: 'https://www.linkedin.com/company/incommand',
    label: 'Follow InCommand on LinkedIn',
    Icon: FaLinkedinIn,
  },
  {
    href: 'https://twitter.com/incommandhq',
    label: 'Follow InCommand on X',
    Icon: FaTwitter,
  },
  {
    href: 'https://www.instagram.com/incommandhq',
    label: 'Follow InCommand on Instagram',
    Icon: FaInstagram,
  },
  {
    href: 'https://www.facebook.com/incommand',
    label: 'Follow InCommand on Facebook',
    Icon: FaFacebook,
  },
  {
    href: 'https://www.tiktok.com/@incommand',
    label: 'Follow InCommand on TikTok',
    Icon: SiTiktok,
  },
  {
    href: 'mailto:info@incommand.uk',
    label: 'Email InCommand',
    Icon: FaEnvelope,
  },
]

export const SocialLinks = ({
  className,
  iconClassName,
  textClassName,
  direction = 'horizontal',
}: SocialLinksProps) => {
  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <p className={cn('text-sm text-blue-100', textClassName)}>
        Follow us for updates and early access announcements.
      </p>
      <div
        className={cn(
          'flex items-center gap-3',
          direction === 'vertical' && 'flex-col gap-2',
        )}
      >
        {socialChannels.map(({ href, label, Icon }) => (
          <a
            key={href}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white/10 text-white transition-all duration-200 hover:scale-110 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80',
              iconClassName,
            )}
          >
            <Icon className="h-4 w-4" />
          </a>
        ))}
      </div>
    </div>
  )
}
