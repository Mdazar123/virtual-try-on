if (typeof window !== 'undefined') {
  const originalConsoleWarn = console.warn
  console.warn = (...args) => {
    if (args[0]?.includes('MediaPipe')) return
    originalConsoleWarn.apply(console, args)
  }
} 