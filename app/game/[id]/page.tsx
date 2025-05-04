"use client"
import { useParams, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useState, useEffect } from "react"
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

  const {
    game,
    board,
    turn,
    status,
    selectedSquare,
    possibleMoves,
    makeMove,
    selectSquare,
    resetGame,
    isThinking,
    playerColor,
  } = useChessGame()

  const { connected, opponent, waitingForOpponent, syncMove } = useMultiplayerGame({
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

  const handleSquareClick = (square: string) => {
    if (mode === "multi" && turn !== (isHost ? "w" : "b")) {
      return // Not your turn in multiplayer
    }

    if (mode === "single" && turn !== playerColor) {
      return // Not your turn in single player
    }

    // When a square is clicked, pass it to the selectSquare function
    // which will handle both selecting pieces and making moves
    const result = selectSquare(square)

    if (result.moved && mode === "multi") {
      syncMove(result.from, result.to)
    }
  }

  const handlePieceDrop = (from: string, to: string) => {
    if (mode === "multi" && turn !== (isHost ? "w" : "b")) {
      return false // Not your turn in multiplayer
    }

    if (mode === "single" && turn !== playerColor) {
      return false // Not your turn in single player
    }

    const moved = makeMove(from, to)
    if (moved && mode === "multi") {
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
              />
            )}

            <ChessBoard
              position={board}
              selectedSquare={selectedSquare}
              possibleMoves={possibleMoves}
              onSquareClick={handleSquareClick}
              onPieceDrop={handlePieceDrop}
              orientation={mode === "single" ? (playerColor === "w" ? "white" : "black") : isHost ? "white" : "black"}
              isThinking={isThinking}
            />

            <GameControls
              status={status}
              turn={turn}
              onReset={() =>
                resetGame(
                  mode as "single" | "multi",
                  mode === "single" ? (colorParam as "w" | "b") : isHost ? "w" : "b",
                )
              }
              playerColor={mode === "multi" ? (isHost ? "w" : "b") : playerColor}
              isThinking={isThinking}
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
