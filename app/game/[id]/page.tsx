"use client"
import { useParams, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { ChessBoard } from "@/components/chess-board"
import { GameControls } from "@/components/game-controls"
import { GameInfo } from "@/components/game-info"
import { SettingsMenu } from "@/components/settings-menu"
import { MultiplayerFallback } from "@/components/multiplayer-fallback"
import { useChessGame } from "@/hooks/use-chess-game"
import { useMultiplayerGame } from "@/hooks/use-multiplayer-game"
import { Settings, ArrowLeft } from "lucide-react"

export default function Game() {
  const params = useParams()
  const searchParams = useSearchParams()
  const gameId = params.id as string
  const mode = searchParams.get("mode") || "single"
  const isHost = searchParams.get("host") === "true"
  const colorParam = searchParams.get("color") || "w"
  const [showSettings, setShowSettings] = useState(false)
  const [showMultiplayerInfo, setShowMultiplayerInfo] = useState(true)
  const [connectionAttempts, setConnectionAttempts] = useState(0)

  // In multiplayer, host is always white, guest is always black
  const playerColor = mode === "multi" ? (isHost ? "w" : "b") : (colorParam as "w" | "b")

  const { game, board, turn, status, selectedSquare, possibleMoves, makeMove, selectSquare, resetGame, isThinking } =
    useChessGame()

  // Initialize game with correct mode
  useEffect(() => {
    console.log("Initializing game with mode:", mode, "isHost:", isHost, "playerColor:", playerColor)
    resetGame(mode as "single" | "multi", playerColor)
  }, [mode, isHost, playerColor, resetGame])

  const { connected, opponent, waitingForOpponent, syncMove, isPlayerTurn, currentTurn, moving } = useMultiplayerGame({
    gameId,
    isHost,
    onMoveReceived: makeMove,
  })

  // Hide multiplayer info after opponent joins
  useEffect(() => {
    if (mode === "multi" && opponent) {
      const timer = setTimeout(() => {
        setShowMultiplayerInfo(false)
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [mode, opponent])

  // Check connection status
  useEffect(() => {
    if (mode === "multi" && !connected) {
      const timer = setTimeout(() => {
        setConnectionAttempts((prev) => prev + 1)
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [mode, connected])

  // Function to check if it's the player's turn
  const checkPlayerTurn = useCallback(() => {
    if (mode === "single") {
      return turn === playerColor
    } else {
      // In multiplayer, use the isPlayerTurn value from the hook
      return isPlayerTurn
    }
  }, [mode, turn, playerColor, isPlayerTurn])

  const handleSquareClick = (square: string) => {
    // Prevent interactions while move is being synced
    if (moving) return

    // In multiplayer mode, enforce turn-based restrictions
    if (mode === "multi") {
      if (!isPlayerTurn) {
        console.log("Not your turn in multiplayer. isPlayerTurn:", isPlayerTurn)
        return
      }

      // If no square is selected yet, make sure we're selecting our own piece
      if (!selectedSquare) {
        const piece = game.get(square)
        if (!piece || piece.color !== playerColor) {
          console.log("Cannot select opponent's piece in multiplayer")
          return
        }
      }
    }

    // When a square is clicked, pass it to the selectSquare function
    // which will handle both selecting pieces and making moves
    const result = selectSquare(square)

    if (result.moved && mode === "multi") {
      console.log("Syncing move in multiplayer mode:", result.from, "to", result.to)
      syncMove(result.from, result.to)
    }
  }

  const handlePieceDrop = (from: string, to: string) => {
    // Prevent interactions while move is being synced
    if (moving) return false

    // In multiplayer mode, enforce turn-based restrictions
    if (mode === "multi") {
      if (!isPlayerTurn) {
        console.log("Not your turn in multiplayer. isPlayerTurn:", isPlayerTurn)
        return false
      }

      // Make sure we're moving our own piece
      const piece = game.get(from)
      if (!piece || piece.color !== playerColor) {
        console.log("Cannot move opponent's piece in multiplayer")
        return false
      }
    }

    const moved = makeMove(from, to)
    if (moved && mode === "multi") {
      console.log("Syncing move in multiplayer mode:", from, "to", to)
      syncMove(from, to)
    }
    return moved
  }

  const toggleSettings = () => {
    setShowSettings(!showSettings)
  }

  const showMultiplayerHelp = () => {
    setShowMultiplayerInfo(true)
  }

  // Debug output
  useEffect(() => {
    if (mode === "multi") {
      console.log("Multiplayer state:", {
        isHost,
        playerColor,
        turn,
        currentTurn,
        isPlayerTurn,
        waitingForOpponent,
        opponent,
      })
    }
  }, [mode, isHost, playerColor, turn, currentTurn, isPlayerTurn, waitingForOpponent, opponent])

  return (
    <main className="flex min-h-screen flex-col items-center p-4 bg-background">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-between items-center">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Chess Game</h1>
          <Button variant="ghost" size="icon" onClick={toggleSettings}>
            <Settings className="h-5 w-5" />
          </Button>
        </div>

        {showSettings ? (
          <SettingsMenu onClose={toggleSettings} />
        ) : mode === "multi" && (showMultiplayerInfo || !connected || connectionAttempts > 2) ? (
          <MultiplayerFallback gameId={gameId} isHost={isHost} />
        ) : (
          <>
            {mode === "multi" && (
              <GameInfo
                connected={connected}
                waitingForOpponent={waitingForOpponent}
                opponent={opponent}
                gameId={gameId}
                turn={turn}
                isHost={isHost}
                isPlayerTurn={isPlayerTurn}
              />
            )}

            <ChessBoard
              position={board}
              selectedSquare={selectedSquare}
              possibleMoves={possibleMoves}
              onSquareClick={handleSquareClick}
              onPieceDrop={handlePieceDrop}
              orientation={mode === "single" ? (playerColor === "w" ? "white" : "black") : isHost ? "white" : "black"}
              isThinking={isThinking || moving}
            />

            <GameControls
              status={status}
              turn={turn}
              onReset={() => resetGame(mode as "single" | "multi", playerColor)}
              playerColor={playerColor}
              isThinking={isThinking}
              isPlayerTurn={checkPlayerTurn()}
            />

            {mode === "multi" && !showMultiplayerInfo && (
              <div className="mt-4 text-center">
                <Button variant="outline" size="sm" onClick={showMultiplayerHelp}>
                  Show Game Info
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
