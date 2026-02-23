import './globals.css'
import React from 'react'
import LayoutWrapper from '../components/LayoutWrapper'

export const metadata = {
  title: 'POS - Dashboard',
  description: 'Point of Sale web UI'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  )
}
