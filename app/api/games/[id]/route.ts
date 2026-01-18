import { NextResponse } from "next/server"
import { getGame, upsertGame } from "@/lib/game-db"

// Add cache control headers to prevent caching
const headers = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const gameId = params.id

  try {
    // Get the current game state from database
    const gameState = await getGame(gameId)

    if (!gameState) {
      // Return default state if game doesn't exist
      const defaultState = {
        id: gameId,
        players: [],
        moves: [],
        currentTurn: "w", // Chess always starts with white
        lastUpdated: Date.now(),
      }
      return NextResponse.json(defaultState, { headers })
    }

    return NextResponse.json(gameState, { headers })
  } catch (error) {
    console.error("Error fetching game:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers })
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const gameId = params.id
  const data = await request.json()

  console.log("POST request to game API:", gameId, data)

  try {
    // Get current game state or initialize a new one
    let currentState = await getGame(gameId)

    if (!currentState) {
      currentState = {
        id: gameId,
        players: [],
        moves: [],
        currentTurn: "w", // Chess always starts with white
        lastUpdated: Date.now(),
      }
    }

    // Update the game state based on the action type
    if (data.type === "join") {
      console.log("Player joining:", data.playerId, "isHost:", data.isHost)

      // Check if player already exists
      const playerIndex = currentState.players.findIndex((p: any) => p.id === data.playerId)

      if (playerIndex >= 0) {
        // Update existing player
        currentState.players[playerIndex] = {
          ...currentState.players[playerIndex],
          lastSeen: Date.now(),
        }
      } else {
        // Add new player
        currentState.players.push({
          id: data.playerId,
          isHost: data.isHost,
          lastSeen: Date.now(),
        })
      }
    }

    // Update the last updated timestamp
    currentState.lastUpdated = Date.now()

    // Save the updated state
    await upsertGame(currentState)

    return NextResponse.json(currentState, { headers })
  } catch (error) {
    console.error("Error updating game:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers })
  }
}
