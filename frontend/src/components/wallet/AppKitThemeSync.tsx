import { useEffect } from 'react'
import { useAppKitTheme } from '@reown/appkit/react'
import { useTheme } from '../../context/ThemeContext'

/** Keeps Reown AppKit modal theme in sync with app dark/light mode */
export function AppKitThemeSync() {
  const { theme } = useTheme()
  const { setThemeMode } = useAppKitTheme()

  useEffect(() => {
    setThemeMode(theme)
  }, [theme, setThemeMode])

  return null
}
