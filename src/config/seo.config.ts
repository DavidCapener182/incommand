import { Metadata } from 'next'

// Base SEO configuration
export const defaultMetadata: Metadata = {
  title: {
    template: '%s | InCommand',
    default: 'InCommand | Event Management & Incident Response Platform (UK)'
  },
  description: 'Manage incidents, monitor safety, and coordinate live operations with InCommand — the AI-powered event control platform built for professionals.',
  keywords: [
    'event management software UK',
    'incident management system',
    'event safety management',
    'festival operations software',
    'crowd management tools',
    'live event command system',
    'event monitoring and reporting',
    'security operations software',
    'JESIP-aligned software',
    'event control platform'
  ],
  authors: [{ name: 'InCommand Team' }],
  creator: 'InCommand',
  publisher: 'InCommand',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://incommand.uk'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: 'https://incommand.uk',
    siteName: 'InCommand',
    title: 'InCommand | Event Management & Incident Response Platform (UK)',
    description: 'Manage incidents, monitor safety, and coordinate live operations with InCommand — the AI-powered event control platform built for professionals.',
    images: [
      {
        url: '/inCommand.png',
        width: 1200,
        height: 630,
        alt: 'InCommand - Event Management Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'InCommand | Event Management & Incident Response Platform (UK)',
    description: 'Manage incidents, monitor safety, and coordinate live operations with InCommand — the AI-powered event control platform built for professionals.',
    images: ['/inCommand.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

// Page-specific metadata
export const pageMetadata = {
  home: {
    title: 'InCommand | Event Management & Incident Response Platform (UK)',
    description: 'Manage incidents, monitor attendance, and track safety performance in real time with InCommand — the UK\'s professional event control platform built for real-world operations.',
    openGraph: {
      title: 'InCommand | Event Management & Incident Response Platform (UK)',
      description: 'Manage incidents, monitor attendance, and track safety performance in real time with InCommand — the UK\'s professional event control platform built for real-world operations.',
    }
  },
  features: {
    title: 'InCommand Features | Event & Incident Management Platform',
    description: 'Explore the features that make InCommand the UK\'s leading event management and incident response platform — from real-time alerts to AI-powered analytics and JESIP-compliant safety tools.',
    openGraph: {
      title: 'InCommand Features | Event & Incident Management Platform',
      description: 'Explore the features that make InCommand the UK\'s leading event management and incident response platform — from real-time alerts to AI-powered analytics and JESIP-compliant safety tools.',
    }
  },
  pricing: {
    title: 'InCommand Pricing | Event & Incident Management Software Plans',
    description: 'Discover flexible pricing for InCommand — the UK\'s leading event management and incident response platform. Choose a plan that fits your operation, from small teams to enterprise-scale deployments.',
    openGraph: {
      title: 'InCommand Pricing | Event & Incident Management Software Plans',
      description: 'Discover flexible pricing for InCommand — the UK\'s leading event management and incident response platform. Choose a plan that fits your operation, from small teams to enterprise-scale deployments.',
    }
  },
  about: {
    title: 'About InCommand | Built for Real-World Event Safety',
    description: 'Learn about InCommand — the UK-based event management and incident response platform founded by professionals with over 15 years in live operations. JESIP-aligned, field-tested, and built for real safety teams.',
    openGraph: {
      title: 'About InCommand | Built for Real-World Event Safety',
      description: 'Learn about InCommand — the UK-based event management and incident response platform founded by professionals with over 15 years in live operations. JESIP-aligned, field-tested, and built for real safety teams.',
    }
  }
}

// Schema markup definitions
export const schemaMarkup = {
  organization: {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "InCommand",
    "url": "https://incommand.uk",
    "logo": "https://incommand.uk/inCommand.png",
    "description": "UK-based event management and incident response platform built for real-world safety teams",
    "foundingDate": "2023",
    "founder": {
      "@type": "Person",
      "name": "David Capener"
    },
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "GB"
    },
    "sameAs": [
      "https://twitter.com/incommand_uk",
      "https://linkedin.com/company/incommand"
    ]
  },
  softwareApplication: {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "InCommand",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "description": "AI-powered event control and incident management platform for UK safety teams",
    "url": "https://incommand.uk",
    "author": {
      "@type": "Organization",
      "name": "InCommand"
    },
    "offers": {
      "@type": "Offer",
      "price": "25",
      "priceCurrency": "GBP",
      "availability": "https://schema.org/InStock"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "150"
    }
  },
  faqPage: {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Can I change or cancel my plan at any time?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Absolutely. You can upgrade, downgrade, or cancel whenever needed — with no hidden fees."
        }
      },
      {
        "@type": "Question",
        "name": "Is there a free trial?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes — every new account includes a 14-day free trial with full platform access."
        }
      },
      {
        "@type": "Question",
        "name": "Do you offer annual billing discounts?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Annual plans receive two months free and priority onboarding support."
        }
      },
      {
        "@type": "Question",
        "name": "How secure is my data?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "All data is encrypted, stored on UK-based servers, and fully compliant with GDPR and ISO 27001 standards."
        }
      }
    ]
  }
}
