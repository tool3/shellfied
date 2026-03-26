import type { Metadata, Viewport } from 'next';
import {
  Outfit,
  Syne,
  JetBrains_Mono,
  Fira_Code,
  Source_Code_Pro,
  IBM_Plex_Mono,
  Roboto_Mono,
  Ubuntu_Mono,
  Space_Mono,
  // Label fonts for compare mode
  Inter,
  Roboto,
  Poppins,
  Montserrat,
  Open_Sans,
  Lato,
  Oswald,
  Raleway,
  Nunito,
  Ubuntu,
  Rubik,
  Work_Sans,
  Quicksand,
  Bebas_Neue,
  Playfair_Display,
  Merriweather,
} from 'next/font/google';
import Script from 'next/script';
import '@/styles/main.scss';

// Font configurations
const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-outfit',
  display: 'swap',
});

const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-syne',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jetbrains',
  display: 'swap',
});

const firaCode = Fira_Code({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-fira',
  display: 'swap',
});

const sourceCodePro = Source_Code_Pro({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-source-code',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ibm-plex',
  display: 'swap',
});

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-roboto-mono',
  display: 'swap',
});

const ubuntuMono = Ubuntu_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-ubuntu-mono',
  display: 'swap',
});

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono',
  display: 'swap',
});

// Label fonts for compare mode
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-roboto',
  display: 'swap',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-montserrat',
  display: 'swap',
});

const openSans = Open_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-open-sans',
  display: 'swap',
});

const lato = Lato({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-lato',
  display: 'swap',
});

const oswald = Oswald({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-oswald',
  display: 'swap',
});

const raleway = Raleway({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-raleway',
  display: 'swap',
});

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-nunito',
  display: 'swap',
});

const ubuntu = Ubuntu({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-ubuntu',
  display: 'swap',
});

const rubik = Rubik({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-rubik',
  display: 'swap',
});

const workSans = Work_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-work-sans',
  display: 'swap',
});

const quicksand = Quicksand({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-quicksand',
  display: 'swap',
});

const bebasNeue = Bebas_Neue({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-bebas-neue',
  display: 'swap',
});

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-playfair',
  display: 'swap',
});

const merriweather = Merriweather({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-merriweather',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://shellfied.vercel.app'),
  title: {
    default: 'Shellfied - Beautiful Code Screenshots & Terminal SVGs',
    template: '%s | Shellfied',
  },
  description: 'Create beautiful, shareable code screenshots and terminal SVGs. Supports 50+ themes, syntax highlighting, compare mode, and one-click export to PNG, SVG, or WebP. Free and open source.',
  keywords: [
    'code screenshot', 'terminal screenshot', 'code to image', 'code snippet',
    'syntax highlighting', 'SVG generator', 'code beautifier', 'carbon alternative',
    'ray.so alternative', 'code sharing', 'developer tools', 'code presentation',
    'terminal SVG', 'shellfie', 'code to SVG', 'code to PNG',
  ],
  authors: [{ name: 'Shellfied' }],
  creator: 'Shellfied',
  publisher: 'Shellfied',
  applicationName: 'Shellfied',
  category: 'Developer Tools',
  openGraph: {
    type: 'website',
    siteName: 'Shellfied',
    url: 'https://shellfied.vercel.app/',
    title: 'Shellfied - Beautiful Code Screenshots & Terminal SVGs',
    description: 'Create beautiful, shareable code screenshots and terminal SVGs. 50+ themes, syntax highlighting, compare mode, and instant export.',
    locale: 'en_US',
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'Shellfied - Beautiful code screenshots',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shellfied - Beautiful Code Screenshots & Terminal SVGs',
    description: 'Create beautiful, shareable code screenshots and terminal SVGs. 50+ themes, syntax highlighting, compare mode, and instant export.',
    images: [{ url: '/og-image.svg', alt: 'Shellfied - Beautiful code screenshots' }],
  },
  icons: {
    icon: '/favicon.svg',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.webmanifest',
  alternates: {
    canonical: 'https://shellfied.vercel.app',
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
};

export const viewport: Viewport = {
  themeColor: '#0C0A09',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${outfit.variable} ${syne.variable} ${jetbrainsMono.variable} ${firaCode.variable} ${sourceCodePro.variable} ${ibmPlexMono.variable} ${robotoMono.variable} ${ubuntuMono.variable} ${spaceMono.variable} ${inter.variable} ${roboto.variable} ${poppins.variable} ${montserrat.variable} ${openSans.variable} ${lato.variable} ${oswald.variable} ${raleway.variable} ${nunito.variable} ${ubuntu.variable} ${rubik.variable} ${workSans.variable} ${quicksand.variable} ${bebasNeue.variable} ${playfairDisplay.variable} ${merriweather.variable}`}>
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-V5WTZ111PR"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-V5WTZ111PR');
          `}
        </Script>
      </head>
      <body suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'Shellfied',
              url: 'https://shellfied.vercel.app',
              description: 'Create beautiful, shareable code screenshots and terminal SVGs. Supports 50+ themes, syntax highlighting, compare mode, and one-click export.',
              applicationCategory: 'DeveloperApplication',
              operatingSystem: 'Any',
              browserRequirements: 'Requires a modern web browser',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
              },
              featureList: [
                'Code syntax highlighting',
                'Terminal SVG generation',
                '50+ color themes',
                'Side-by-side compare mode',
                'Export to PNG, SVG, WebP, JPEG',
                'Custom backgrounds and gradients',
                'Shareable short URLs',
                'Open Graph image generation',
              ],
            }),
          }}
        />
        {children}
      </body>
    </html>
  );
}
