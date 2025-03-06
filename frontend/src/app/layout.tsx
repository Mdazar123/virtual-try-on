import type { Metadata } from 'next'
import '../styles/globals.css'

export const metadata: Metadata = {
  title: 'Virtual Try-On',
  description: 'Virtual Try-On Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <div className="layout">
          <header>
            <nav>
              <h1>Virtual Try-On</h1>
            </nav>
          </header>
          <main>{children}</main>
          <footer>
            <p>© 2024 Virtual Try-On. All rights reserved.</p>
          </footer>
        </div>
      </body>
    </html>
  )
}
