import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Header, Footer } from '@/components/layout';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: {
    default: 'HSAFX Tools - 446+ Free Online Developer Tools',
    template: '%s | HSAFX Tools',
  },
  description:
    'Free online developer tools including text converters, data transformers, image processors, code generators, and more. Fast, secure, and privacy-focused.',
  keywords: [
    'developer tools',
    'online tools',
    'text converter',
    'json formatter',
    'base64 encoder',
    'url encoder',
    'uuid generator',
    'password generator',
    'image converter',
    'pdf tools',
  ],
  authors: [{ name: 'HSAFX' }],
  creator: 'HSAFX',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://tools.hsafx.com'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'HSAFX Tools',
    title: 'HSAFX Tools - 446+ Free Online Developer Tools',
    description: 'Free online developer tools. Fast, secure, and privacy-focused.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HSAFX Tools - 446+ Free Online Developer Tools',
    description: 'Free online developer tools. Fast, secure, and privacy-focused.',
    creator: '@hsafx',
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
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Theme initialization script - runs before paint to prevent FOUC */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  try {
    // Read stored mode from next-themes storage key
    var storedMode = localStorage.getItem('hsafx-theme-mode');
    var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Determine effective mode
    var isDark = storedMode === 'dark' || (storedMode === 'system' && systemDark) || (!storedMode && systemDark);
    
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Mark as theme-ready to prevent flash
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
  } catch (e) {}
})();
            `.trim(),
          }}
        />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} min-h-screen bg-background font-sans antialiased`}>
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}

