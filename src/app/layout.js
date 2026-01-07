import './globals.css'

export const metadata = {
  title: 'Atlas Economy - Video Automation',
  description: 'AI-powered financial education video generator',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}