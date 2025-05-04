"use client"

import type React from "react"

import { getPieceComponent } from "@/lib/chess-pieces"
import { useTheme } from "@/hooks/use-theme"

interface SquareProps {
  square: string
  piece: string
  isLight: boolean
  isSelected?: boolean
  isPossibleMove?: boolean
  onClick?: () => void
  onDragStart?: (e: React.MouseEvent | React.TouchEvent) => void
  preview?: boolean
  isDragging?: boolean
}

export function Square({
  square,
  piece,
  isLight,
  isSelected = false,
  isPossibleMove = false,
  onClick,
  onDragStart,
  preview = false,
  isDragging = false,
}: SquareProps) {
  const { currentColorScheme } = useTheme()

  // Get colors from the current theme
  const lightSquareColor = currentColorScheme.lightSquare
  const darkSquareColor = currentColorScheme.darkSquare
  const selectedRingColor = currentColorScheme.selected
  const possibleMoveColor = currentColorScheme.possibleMove

  const bgColor = isLight ? lightSquareColor : darkSquareColor

  const selectedClass = isSelected ? `ring-2 ring-inset ${selectedRingColor}` : ""

  // Create a visible indicator for possible moves
  const possibleMoveClass = isPossibleMove
    ? `after:content-[''] after:absolute after:inset-0 after:m-auto after:w-3 after:h-3 after:rounded-full after:bg-blue-500/40 dark:after:bg-blue-400/40`
    : ""

  const PieceComponent = getPieceComponent(piece)

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (PieceComponent && onDragStart) {
      onDragStart(e)
    }
  }

  return (
    <div
      className={`relative ${bgColor} ${selectedClass} ${possibleMoveClass} ${
        !preview && !isDragging ? "cursor-pointer" : ""
      } ${isDragging ? "opacity-100" : ""}`}
      onClick={onClick}
      onMouseDown={handleMouseDown}
      onTouchStart={handleMouseDown}
      data-square={square}
    >
      {PieceComponent && (
        <div
          className={`absolute inset-0 flex items-center justify-center ${!preview && !isDragging ? "touch-none" : ""}`}
        >
          <PieceComponent className={`w-full h-full p-1 ${preview ? "p-2" : ""}`} />
        </div>
      )}
    </div>
  )
}
