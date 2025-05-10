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
  const [lastMoveBy, setLastMoveBy] = useState<string | null>(null)
  const lastProcessedMoveTimestamp = useRef<number>(0)
  const pollInterval = useRef<NodeJS.Timeout | null>(null)
  const lastPingTime = useRef<number>(Date.now())
  const playerId = useRef<string>(Math.random().toString(36).substring(2, 15))
  const retryCount = useRef<number>(0)
  const maxRetries = 3

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
      retryCount.current = 0
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
      retryCount.current = 0
      return true
    } catch (error) {
      console.error("Error pinging game:", error)
      retryCount.current += 1

      if (retryCount.current > maxRetries) {
        setConnected(false)
      }

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
      setOpponent(hasActiveOpponent ? opponentPlayer.id : null)

      // Process new moves
      const moves = gameState.moves || []

      // Sort moves by timestamp to ensure correct order
      moves.sort((a: any, b: any) => a.timestamp - b.timestamp)

      // Find the latest move
      if (moves.length > 0) {
        const latestMove = moves[moves.length - 1]
        setLastMoveBy(latestMove.playerId)
      }

      // Process only new moves we haven't seen yet
      const newMoves = moves.filter((move: any) => move.timestamp > lastProcessedMoveTimestamp.current)

      if (newMoves.length > 0) {
        console.log(`Found ${newMoves.length} new moves to process`)

        // Process each move that wasn't made by us
        for (const move of newMoves) {
          if (move.playerId !== playerId.current) {
            console.log("Received move from opponent:", move)
            onMoveReceived(move.from, move.to)
            lastProcessedMoveTimestamp.current = move.timestamp
          } else {
            // Update our last processed timestamp even for our own moves
            lastProcessedMoveTimestamp.current = Math.max(lastProcessedMoveTimestamp.current, move.timestamp)
          }
        }
      }

      // Ping to keep our presence known
      await pingGame()

      retryCount.current = 0
      setConnected(true)
      return true
    } catch (error) {
      console.error("Error polling game state:", error)
      retryCount.current += 1

      if (retryCount.current > maxRetries) {
        setConnected(false)
      }

      return false
    }
  }, [gameId, isHost, onMoveReceived, pingGame])

  // Function to sync moves with opponent
  const syncMove = useCallback(
    async (from: string, to: string) => {
      try {
        console.log("Syncing move:", from, "to", to, "by player:", playerId.current)
        const timestamp = Date.now()

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
              timestamp,
            },
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to sync move")
        }

        // Update our last processed move timestamp
        lastProcessedMoveTimestamp.current = timestamp
        setLastMoveBy(playerId.current)

        // Immediately poll for updates to reduce latency
        setTimeout(pollGameState, 500)

        return true
      } catch (error) {
        console.error("Error syncing move:", error)
        retryCount.current += 1

        if (retryCount.current > maxRetries) {
          setConnected(false)
        }

        return false
      }
    },
    [gameId, pollGameState],
  )

  // Initialize game and start polling
  useEffect(() => {
    const initialize = async () => {
      await joinGame()

      // Start polling for updates more frequently
      pollInterval.current = setInterval(pollGameState, 1000) // Poll every second instead of 2 seconds

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

  // Determine if it's the player's turn based on the last move
  const isPlayerTurn = useCallback(() => {
    // If no moves have been made yet, host goes first
    if (!lastMoveBy) {
      return isHost
    }

    // Otherwise, it's the player's turn if the last move was made by the opponent
    return lastMoveBy !== playerId.current
  }, [isHost, lastMoveBy])

  return {
    connected,
    opponent,
    waitingForOpponent,
    syncMove,
    isPlayerTurn: isPlayerTurn(),
  }
}
