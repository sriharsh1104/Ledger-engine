import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggleTheme}
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="relative flex items-center w-[52px] h-7 rounded-full p-0.5 cursor-pointer transition-colors duration-300
        bg-surface-overlay border border-border-subtle hover:border-border"
    >
      <span
        className={`absolute w-6 h-6 rounded-full bg-accent shadow-md transition-transform duration-300 flex items-center justify-center
          ${isDark ? 'translate-x-[22px]' : 'translate-x-0'}`}
      >
        {isDark ? (
          <Moon className="w-3.5 h-3.5 text-white" />
        ) : (
          <Sun className="w-3.5 h-3.5 text-white" />
        )}
      </span>
      <span className="flex w-full justify-between px-1.5 pointer-events-none">
        <Sun className={`w-3 h-3 transition-opacity ${isDark ? 'opacity-30' : 'opacity-0'}`} />
        <Moon className={`w-3 h-3 transition-opacity ${isDark ? 'opacity-0' : 'opacity-30'}`} />
      </span>
    </button>
  )
}
