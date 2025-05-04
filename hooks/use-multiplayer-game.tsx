"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface UseMultiplayerGameProps {
  gameId: string
  isHost: boolean
  onMoveReceived: (from: string, to: string) => boolean
}

interface GamePlayer {
  id: string
  isHost: boolean
  lastSeen: number
}

interface GameMove {
  from: string
  to: string
  playerId: string
  timestamp: number
}

interface GameState {
  id: string
  players: GamePlayer[]
  moves: GameMove[]
  lastUpdated: number
}

export function useMultiplayerGame({ gameId, isHost, onMoveReceived }: UseMultiplayerGameProps) {
  const [connected, setConnected] = useState(true)
  const [opponent, setOpponent] = useState<string | null>(null)
  const [waitingForOpponent, setWaitingForOpponent] = useState(isHost)
  const lastProcessedMoveTimestamp = useRef<number>(0)
  const pollInterval = useRef<NodeJS.Timeout | null>(null)
  const lastPingTime = useRef<number>(Date.now())
  const playerId = useRef<string>(Math.random().toString(36).substring(2, 15))

  // Join the game
  const joinGame = useCallback(async () => {
    try {
      console.log("Joining game:", gameId, "as", isHost ? "host" : "guest")
      const response = await fetch(`/api/games/${gameId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "join",
          player: {
            id: playerId.current,
            isHost,
            joinedAt: Date.now(),
          },
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

  // Ping to keep connection alive
  const pingGame = useCallback(async () => {
    try {
      const response = await fetch(`/api/games/${gameId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "ping",
          playerId: playerId.current,
          isHost,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to ping game")
      }

      lastPingTime.current = Date.now()
      setConnected(true)
      return true
    } catch (error) {
      console.error("Error pinging game:", error)
      setConnected(false)
      return false
    }
  }, [gameId, isHost])

  // Poll for game updates
  const pollGameState = useCallback(async () => {
    try {
      const response = await fetch(`/api/games/${gameId}`)

      if (!response.ok) {
        throw new Error("Failed to get game state")
      }

      const gameState = await response.json()

      // Debug output
      console.log("Game state:", gameState)

      // Check for opponent
      const players = gameState.players || []
      const opponentPlayer = players.find((p: any) => p.isHost !== isHost)

      // Check if opponent is active (seen in the last 30 seconds)
      const hasActiveOpponent = opponentPlayer && Date.now() - opponentPlayer.lastSeen < 30000

      setWaitingForOpponent(!hasActiveOpponent)
      setOpponent(hasActiveOpponent ? "Opponent" : null)

      // Process new moves
      const moves = gameState.moves || []
      const newMoves = moves.filter((move: any) => move.timestamp > lastProcessedMoveTimestamp.current)

      if (newMoves.length > 0) {
        // Sort moves by timestamp
        newMoves.sort((a: any, b: any) => a.timestamp - b.timestamp)

        // Process each move that wasn't made by us
        for (const move of newMoves) {
          if (move.playerId !== playerId.current) {
            console.log("Received move from opponent:", move)
            onMoveReceived(move.from, move.to)
            lastProcessedMoveTimestamp.current = move.timestamp
          }
        }
      }

      // Ping to keep our presence known
      await pingGame()

      return true
    } catch (error) {
      console.error("Error polling game state:", error)
      setConnected(false)
      return false
    }
  }, [gameId, isHost, onMoveReceived, pingGame])

  // Function to sync moves with opponent
  const syncMove = useCallback(
    async (from: string, to: string) => {
      try {
        console.log("Syncing move:", from, "to", to)
        const response = await fetch(`/api/games/${gameId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "move",
            playerId: playerId.current,
            move: {
              from,
              to,
              playerId: playerId.current,
            },
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to sync move")
        }

        // Update our last processed move timestamp
        const data = await response.json()
        const moves = data.moves || []
        if (moves.length > 0) {
          const latestMove = moves[moves.length - 1]
          lastProcessedMoveTimestamp.current = latestMove.timestamp
        }

        return true
      } catch (error) {
        console.error("Error syncing move:", error)
        setConnected(false)
        return false
      }
    },
    [gameId],
  )

  // Initialize game and start polling
  useEffect(() => {
    const initialize = async () => {
      await joinGame()

      // Start polling for updates
      pollInterval.current = setInterval(pollGameState, 2000)
    }

    initialize()

    return () => {
      if (pollInterval.current) {
        clearInterval(pollInterval.current)
      }
    }
  }, [joinGame, pollGameState])

  // Check connection status
  useEffect(() => {
    const connectionCheck = setInterval(() => {
      // If we haven't successfully polled in 10 seconds, consider disconnected
      if (Date.now() - lastPingTime.current > 10000) {
        setConnected(false)
      }
    }, 5000)

    return () => clearInterval(connectionCheck)
  }, [])

  return {
    connected,
    opponent,
    waitingForOpponent,
    syncMove,
  }
}
