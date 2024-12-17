import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/components/auth-provider';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { SiteHeader } from '@/components/side-header';
import { SupportChatWidget } from '@/components/support-chat-widget';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Reviser - Smart Learning System',
  description: 'Master any subject with our advanced spaced repetition flashcard system',
  keywords: ['flashcards', 'learning', 'spaced repetition', 'education', 'study','test'],
  authors: [{ name: 'Reviser' }],
  creator: 'Reviser Team',
  publisher: 'Reviser Inc.',
  metadataBase: new URL('https://reviser.me'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Reviser AI - Smart Learning System',
    description: 'Master any subject with our advanced spaced repetition flashcard system',
    url: 'https://reviser.me',
    siteName: 'Reviser AI',
    locale: 'en_US',
    type: 'website',
    images: {
      url: 'favicon.ico',
      alt: 'Reviser AI Logo',
      width: 32,
      height: 32,
    },
    
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Reviser - Smart Learning System',
    description: 'Master any subject with our advanced spaced repetition flashcard system',
    creator: '@ahmad_nekz',
    images: ['android-chrome-512x512.png'],
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
  verification: {
    google: 'MWVy8YkPvZE0BhM1EHeHKpPakdwpzyzjaQPDx5atYjM',
    yandex: 'your-yandex-verification-code',
    other: {
      'facebook-domain-verification': 'your-facebook-verification-code',
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
      <link
  rel="icon"
  href="favicon.ico"
  type="image/x-icon"
  sizes="32x32"
/>
<link
  rel="icon"
  href="favicon.ico"
  type="image/x-icon"
  sizes="16x16"
/>
<link
  rel="apple-touch-icon"
  href="favicon.ico"
  type="image/x-icon"
  sizes="180x180"
/>
<link
  rel="manifest"
  href="/site.webmanifest"
/>
<meta name="google-site-verification" content="MWVy8YkPvZE0BhM1EHeHKpPakdwpzyzjaQPDx5atYjM" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.pdfjsLib = {
                workerSrc: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${process.env.NEXT_PUBLIC_PDFJS_VERSION}/pdf.worker.min.js"
              };
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <SiteHeader />
            {children}
            <Toaster />
            <SupportChatWidget />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}