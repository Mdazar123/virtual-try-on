'use client'

import React from 'react'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
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
  )
}

export default Layout