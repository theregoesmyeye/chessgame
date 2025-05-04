"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Chess } from "chess.js"

export function useChessGame() {
  const [game, setGame] = useState<Chess>(new Chess())
  const [board, setBoard] = useState<string>(game.fen())
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null)
  const [possibleMoves, setPossibleMoves] = useState<string[]>([])
  const [turn, setTurn] = useState<string>(game.turn())
  const [status, setStatus] = useState<string>("active")
  const [isThinking, setIsThinking] = useState(false)
  const gameMode = useRef<"single" | "multi">("single")
  const playerColor = useRef<"w" | "b">("w")

  const updateGameState = useCallback(() => {
    setBoard(game.fen())
    setTurn(game.turn())

    if (game.isCheckmate()) {
      setStatus("checkmate")
    } else if (game.isDraw()) {
      setStatus("draw")
    } else if (game.isStalemate()) {
      setStatus("stalemate")
    } else if (game.isCheck()) {
      setStatus("check")
    } else {
      setStatus("active")
    }
  }, [game])

  const resetGame = useCallback((mode: "single" | "multi" = "single", color: "w" | "b" = "w") => {
    const newGame = new Chess()
    setGame(newGame)
    setBoard(newGame.fen())
    setSelectedSquare(null)
    setPossibleMoves([])
    setTurn(newGame.turn())
    setStatus("active")
    gameMode.current = mode
    playerColor.current = color
  }, [])

  const makeMove = useCallback(
    (from: string, to: string) => {
      try {
        // Attempt to make the move
        game.move({ from, to, promotion: "q" })

        // Update game state
        updateGameState()

        // Clear selection and possible moves
        setSelectedSquare(null)
        setPossibleMoves([])

        return true
      } catch (e) {
        console.error("Invalid move:", e)
        return false
      }
    },
    [game, updateGameState],
  )

  const selectSquare = useCallback(
    (square: string) => {
      const result = { moved: false, from: "", to: "" }

      // If a square is already selected
      if (selectedSquare) {
        // Check if the clicked square is a valid destination (including captures)
        if (possibleMoves.includes(square)) {
          // It's a valid move (including captures), so make the move
          result.from = selectedSquare
          result.to = square
          result.moved = makeMove(selectedSquare, square)
          return result
        } else {
          // If it's not a valid move destination
          const piece = game.get(square)

          // If it's another one of the player's pieces, select it instead
          if (piece && piece.color === game.turn()) {
            setSelectedSquare(square)
            const moves = game.moves({ square, verbose: true })
            setPossibleMoves(moves.map((move: any) => move.to))
          } else {
            // It's not a valid move and not a player's piece, so deselect
            setSelectedSquare(null)
            setPossibleMoves([])
          }
          return result
        }
      }

      // No square is currently selected
      const piece = game.get(square)

      // Only select squares with pieces of the current turn
      if (piece && piece.color === game.turn()) {
        setSelectedSquare(square)

        // Get possible moves for the selected piece
        const moves = game.moves({ square, verbose: true })
        setPossibleMoves(moves.map((move: any) => move.to))
      }

      return result
    },
    [selectedSquare, possibleMoves, game, makeMove],
  )

  // Bot move logic
  const makeBotMove = useCallback(() => {
    // IMPORTANT: Never make bot moves in multiplayer mode
    if (
      gameMode.current !== "single" ||
      turn !== (playerColor.current === "w" ? "b" : "w") ||
      ["checkmate", "draw", "stalemate"].includes(status)
    ) {
      return
    }

    setIsThinking(true)

    // Use setTimeout to give a more natural feel to the bot's "thinking"
    setTimeout(
      () => {
        try {
          // Get all legal moves
          const moves = game.moves({ verbose: true })

          if (moves.length > 0) {
            // Simple bot strategy: evaluate captures and checks first, then random moves
            // Sort moves to prioritize captures and checks
            moves.sort((a: any, b: any) => {
              // Prioritize captures based on piece value
              const getPieceValue = (piece: string | null) => {
                if (!piece) return 0
                const values: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }
                return values[piece.toLowerCase()] || 0
              }

              const aValue = a.captured ? getPieceValue(a.captured) : 0
              const bValue = b.captured ? getPieceValue(b.captured) : 0

              // Prioritize checks
              if (a.san.includes("+") && !b.san.includes("+")) return -1
              if (!a.san.includes("+") && b.san.includes("+")) return 1

              // Then prioritize captures by value
              return bValue - aValue
            })

            // Select a move with some randomness but bias toward better moves
            const moveIndex = Math.floor(Math.random() * Math.min(3, moves.length))
            const move = moves[moveIndex]

            game.move(move)
            updateGameState()
          }
        } catch (e) {
          console.error("Bot move error:", e)
        }

        setIsThinking(false)
      },
      500 + Math.random() * 1000,
    ) // Random delay between 500ms and 1500ms
  }, [game, turn, status, updateGameState, playerColor])

  // Make bot move when it's the bot's turn - ONLY in single player mode
  useEffect(() => {
    // Double-check that we're in single player mode before making bot moves
    if (
      gameMode.current === "single" &&
      turn !== playerColor.current &&
      !["checkmate", "draw", "stalemate"].includes(status)
    ) {
      makeBotMove()
    }
  }, [turn, makeBotMove, status, playerColor])

  // Initialize the game
  useEffect(() => {
    resetGame()
  }, [resetGame])

  return {
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
    playerColor: playerColor.current,
    gameMode: gameMode.current,
  }
}
