import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

// Application metadata, used for SEO and social sharing
export const metadata: Metadata = {
  // favicon.ico => is the icon shown in the browser tab and when sharing the app on social media
  title: "AI-Powered Daily Journal App", // title of the app which shows as the title of the browser tab and in search engine results
  description: "An AI-powered daily journal app that helps you reflect on your day and improve your mental health.", // description of the app which shows in search engine results and when sharing the app on social media
};

// Root layout component that wraps all pages in the app
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ClerkProvider afterSignOutUrl="/sign-in">
          {children}
        </ClerkProvider>
      </body>
    </html>
  )
}