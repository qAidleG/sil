import './globals.css'
import { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from './providers'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#111827',
}

export const metadata: Metadata = {
  title: 'Secretaries Infinite Library',
  description: 'A hub for all my projects',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
  },
  applicationName: 'SIL',
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icon-192x192.png' },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
} 