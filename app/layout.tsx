import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/components/auth-provider';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { SiteHeader } from '@/components/side-header';

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
    title: 'Reviser - Smart Learning System',
    description: 'Master any subject with our advanced spaced repetition flashcard system',
    url: 'https://reviser.me',
    siteName: 'Flashcard Master',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: 'https://reviser.me/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Reviser - Smart Learning System',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Reviser - Smart Learning System',
    description: 'Master any subject with our advanced spaced repetition flashcard system',
    creator: '@yourhandle',
    images: ['https://reviser.me/twitter-image.jpg'],
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
    google: 'your-google-verification-code',
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
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}