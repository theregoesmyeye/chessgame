"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface UseMultiplayerGameProps {
  gameId: string
  isHost: boolean
  onMoveReceived: (from: string, to: string) => boolean
}

export function useMultiplayerGame({ gameId, isHost, onMoveReceived }: UseMultiplayerGameProps) {
  const [connected, setConnected] = useState(true)
  const [opponent, setOpponent] = useState<string | null>(null)
  const [waitingForOpponent, setWaitingForOpponent] = useState(isHost)
  const [currentTurn, setCurrentTurn] = useState<"w" | "b">("w") // Chess always starts with white
  const [moving, setMoving] = useState(false)
  const playerId = useRef<string>(Math.random().toString(36).substring(2, 15))
  const pollInterval = useRef<NodeJS.Timeout | null>(null)
  const lastMoveTimestamp = useRef<number>(0)

  // Simple function to determine if it's the player's turn
  const isPlayerTurn = useCallback(() => {
    return (isHost && currentTurn === "w") || (!isHost && currentTurn === "b")
  }, [isHost, currentTurn])

  // Join the game
  const joinGame = useCallback(async () => {
    try {
      console.log("Joining game:", gameId, "as", isHost ? "host" : "guest", "playerId:", playerId.current)

      const response = await fetch(`/api/games/${gameId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "join",
          playerId: playerId.current,
          isHost,
          timestamp: Date.now(),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to join game")
      }

      setConnected(true)
      return true
    } catch (error) {
      console.error("Error joining game:", error)
      setConnected(false)
      return false
    }
  }, [gameId, isHost])

  // Poll for game updates
  const pollGameState = useCallback(async () => {
    try {
      const response = await fetch(`/api/games/${gameId}?t=${Date.now()}`, {
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error("Failed to get game state")
      }

      const gameState = await response.json()
      console.log("Game state:", gameState)

      // Check for opponent
      const players = gameState.players || []
      const opponentPlayer = players.find((p: any) => p.isHost !== isHost)

      if (opponentPlayer) {
        setOpponent(opponentPlayer.id)
        setWaitingForOpponent(false)
      } else {
        setOpponent(null)
        setWaitingForOpponent(true)
      }

      // Process moves
      const moves = gameState.moves || []

      // Find new moves we haven't processed yet
      const newMoves = moves.filter((move: any) => move.timestamp > lastMoveTimestamp.current)

      if (newMoves.length > 0) {
        // Sort by timestamp to ensure correct order
        newMoves.sort((a: any, b: any) => a.timestamp - b.timestamp)

        // Process each new move
        for (const move of newMoves) {
          // Only process moves from the opponent
          if (move.playerId !== playerId.current) {
            console.log("Processing opponent move:", move)
            onMoveReceived(move.from, move.to)

            // Update turn after processing the move
            setCurrentTurn(move.turn === "w" ? "b" : "w")
          }

          // Update our last processed timestamp
          lastMoveTimestamp.current = Math.max(lastMoveTimestamp.current, move.timestamp)
        }
      }

      // Update current turn from game state if available
      if (gameState.currentTurn) {
        setCurrentTurn(gameState.currentTurn)
      }

      // Ping to keep our presence known
      await fetch(`/api/games/${gameId}/ping`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerId: playerId.current,
          isHost,
          timestamp: Date.now(),
        }),
      })

      setConnected(true)
      return true
    } catch (error) {
      console.error("Error polling game state:", error)
      setConnected(false)
      return false
    }
  }, [gameId, isHost, onMoveReceived])

  // Function to sync moves with opponent
  const syncMove = useCallback(
    async (from: string, to: string) => {
      if (moving) return false
      try {
        setMoving(true)
        const timestamp = Date.now()
        console.log("Syncing move:", from, "to", to, "by player:", playerId.current)

        // Calculate the next turn after this move
        const nextTurn = currentTurn === "w" ? "b" : "w"

        const response = await fetch(`/api/games/${gameId}/move`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            playerId: playerId.current,
            from,
            to,
            timestamp,
            turn: currentTurn, // Current turn when move was made
            nextTurn, // Next turn after this move
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to sync move")
        }

        // Update our last processed timestamp
        lastMoveTimestamp.current = timestamp

        // Update the turn locally
        setCurrentTurn(nextTurn)

        // Immediately poll for updates and re-enable moving
        setTimeout(() => {
          pollGameState()
          setMoving(false)
        }, 300)

        return true
      } catch (error) {
        console.error("Error syncing move:", error)
        setConnected(false)
        setMoving(false)
        return false
      }
    },
    [gameId, pollGameState, currentTurn],
  )

  // Initialize game and start polling
  useEffect(() => {
    const initialize = async () => {
      await joinGame()

      // Start polling for updates
      pollInterval.current = setInterval(pollGameState, 1000)

      // Do an immediate poll after joining
      pollGameState()
    }

    initialize()

    return () => {
      if (pollInterval.current) {
        clearInterval(pollInterval.current)
      }
    }
  }, [joinGame, pollGameState])

  return {
    connected,
    opponent,
    waitingForOpponent,
    syncMove,
    isPlayerTurn: isPlayerTurn(),
    currentTurn,
    moving,
  }
}
