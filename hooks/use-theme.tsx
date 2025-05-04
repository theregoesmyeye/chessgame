"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"

export type ThemeMode = "light" | "dark" | "system"
export type ThemeColor = "classic" | "blue" | "green" | "purple" | "orange"

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: ThemeMode
  defaultColor?: ThemeColor
}

interface ThemeContextType {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
  color: ThemeColor
  setColor: (color: ThemeColor) => void
  currentColorScheme: Record<string, string>
}

// Define color schemes for different themes
const colorSchemes: Record<ThemeColor, Record<string, string>> = {
  classic: {
    lightSquare: "bg-slate-200 dark:bg-slate-600",
    darkSquare: "bg-slate-400 dark:bg-slate-800",
    selected: "ring-blue-500 dark:ring-blue-400",
    possibleMove: "bg-blue-500/40 dark:bg-blue-400/40",
    primary: "bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white",
    accent: "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
  },
  blue: {
    lightSquare: "bg-sky-100 dark:bg-sky-900",
    darkSquare: "bg-sky-500 dark:bg-sky-800",
    selected: "ring-blue-600 dark:ring-blue-300",
    possibleMove: "bg-blue-600/40 dark:bg-blue-300/40",
    primary: "bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white",
    accent: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  },
  green: {
    lightSquare: "bg-emerald-100 dark:bg-emerald-900",
    darkSquare: "bg-emerald-500 dark:bg-emerald-800",
    selected: "ring-emerald-600 dark:ring-emerald-300",
    possibleMove: "bg-emerald-600/40 dark:bg-emerald-300/40",
    primary: "bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white",
    accent: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100",
  },
  purple: {
    lightSquare: "bg-violet-100 dark:bg-violet-900",
    darkSquare: "bg-violet-400 dark:bg-violet-800",
    selected: "ring-violet-600 dark:ring-violet-300",
    possibleMove: "bg-violet-600/40 dark:bg-violet-300/40",
    primary: "bg-violet-600 hover:bg-violet-700 dark:bg-violet-700 dark:hover:bg-violet-600 text-white",
    accent: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-100",
  },
  orange: {
    lightSquare: "bg-amber-100 dark:bg-amber-900",
    darkSquare: "bg-amber-400 dark:bg-amber-800",
    selected: "ring-amber-600 dark:ring-amber-300",
    possibleMove: "bg-amber-600/40 dark:bg-amber-300/40",
    primary: "bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600 text-white",
    accent: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100",
  },
}

const initialState: ThemeContextType = {
  theme: "system",
  setTheme: () => null,
  color: "classic",
  setColor: () => null,
  currentColorScheme: colorSchemes.classic,
}

const ThemeContext = createContext<ThemeContextType>(initialState)

export function ThemeProvider({ children, defaultTheme = "system", defaultColor = "classic" }: ThemeProviderProps) {
  const [theme, setTheme] = useState<ThemeMode>(defaultTheme)
  const [color, setColor] = useState<ThemeColor>(defaultColor)
  const [currentColorScheme, setCurrentColorScheme] = useState(colorSchemes[defaultColor])

  // Load saved theme and color from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as ThemeMode
    const savedColor = localStorage.getItem("themeColor") as ThemeColor

    if (savedTheme) {
      setTheme(savedTheme)
    }

    if (savedColor) {
      setColor(savedColor)
      setCurrentColorScheme(colorSchemes[savedColor])
    }
  }, [])

  // Update theme class on document
  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove("light", "dark")

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme)
  }, [theme])

  // Update color scheme when color changes
  useEffect(() => {
    setCurrentColorScheme(colorSchemes[color])
  }, [color])

  const value = {
    theme,
    setTheme: (theme: ThemeMode) => {
      setTheme(theme)
      localStorage.setItem("theme", theme)
    },
    color,
    setColor: (color: ThemeColor) => {
      setColor(color)
      setCurrentColorScheme(colorSchemes[color])
      localStorage.setItem("themeColor", color)
    },
    currentColorScheme,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => {
  const context = useContext(ThemeContext)

  if (context === undefined) throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
