"use client"

import { Button } from "@/components/ui/button"
import { RefreshCw, Crown, Clock } from "lucide-react"
import { useTheme } from "@/hooks/use-theme"

interface GameControlsProps {
  status: string
  turn: string
  onReset: () => void
  playerColor: string
  isThinking?: boolean
}

export function GameControls({ status, turn, onReset, playerColor, isThinking = false }: GameControlsProps) {
  const { currentColorScheme } = useTheme()
  const isPlayerTurn = turn === playerColor

  const getStatusMessage = () => {
    if (status === "checkmate") {
      return `Checkmate! ${turn === "w" ? "Black" : "White"} wins!`
    } else if (status === "draw") {
      return "Game ended in a draw"
    } else if (status === "stalemate") {
      return "Stalemate! Game ended in a draw"
    } else if (status === "check") {
      return `${turn === "w" ? "White" : "Black"} is in check`
    } else if (isThinking) {
      return "Computer is thinking..."
    } else {
      return `${turn === "w" ? "White" : "Black"} to move${isPlayerTurn ? " (Your turn)" : ""}`
    }
  }

  const isGameOver = ["checkmate", "draw", "stalemate"].includes(status)

  return (
    <div className="flex flex-col space-y-3">
      <div
        className={`p-3 rounded-md text-center ${
          isGameOver
            ? "bg-muted text-foreground"
            : isThinking
              ? "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300"
              : isPlayerTurn
                ? "bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-300"
                : "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300"
        }`}
      >
        {status === "check" && <Crown className="inline-block mr-1 h-4 w-4" />}
        {isThinking && <Clock className="inline-block mr-1 h-4 w-4 animate-pulse" />}
        {getStatusMessage()}
      </div>

      {isGameOver && (
        <Button onClick={onReset} variant="outline" className="w-full">
          <RefreshCw className="mr-2 h-4 w-4" />
          New Game
        </Button>
      )}
    </div>
  )
}
