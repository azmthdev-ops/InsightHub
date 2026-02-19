"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/providers/theme-provider"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="rounded-lg hover:bg-accent"
      >
        <Sun className="h-5 w-5" />
      </Button>
    )
  }

  return <ThemeToggleInner />
}

function ThemeToggleInner() {
  const { theme, toggleTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="rounded-lg hover:bg-accent transition-all duration-200"
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      <div className="relative h-5 w-5">
        <Sun className={`absolute h-5 w-5 transition-all duration-300 ${
          theme === "dark" ? "rotate-0 scale-100" : "rotate-90 scale-0"
        }`} />
        <Moon className={`absolute h-5 w-5 transition-all duration-300 ${
          theme === "dark" ? "-rotate-90 scale-0" : "rotate-0 scale-100"
        }`} />
      </div>
    </Button>
  )
}
