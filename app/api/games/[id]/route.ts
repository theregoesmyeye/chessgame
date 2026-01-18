import { NextResponse } from "next/server"
import { getGame, saveGame, type GameState } from "@/lib/supabase"

// Add cache control headers to prevent caching
const headers = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const gameId = params.id

  try {
    // Get game state from Supabase
    const gameState = await getGame(gameId)

    if (!gameState) {
      // Create new game state
      const newGameState: GameState = {
        id: gameId,
        players: [],
        moves: [],
        currentTurn: "w", // Chess always starts with white
        lastUpdated: Date.now(),
      }
      await saveGame(newGameState)
      return NextResponse.json(newGameState, { headers })
    }

    return NextResponse.json(gameState, { headers })
  } catch (error) {
    console.error("Error getting game:", error)
    return NextResponse.json(
      { error: "Failed to get game state" },
      { status: 500, headers }
    )
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const gameId = params.id
  const data = await request.json()

  console.log("POST request to game API:", gameId, data)

  try {
    // Get current game state from Supabase
    let currentState = await getGame(gameId)

    if (!currentState) {
      // Initialize a new game
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

    // Save the updated state to Supabase
    await saveGame(currentState)

    return NextResponse.json(currentState, { headers })
  } catch (error) {
    console.error("Error updating game:", error)
    return NextResponse.json(
      { error: "Failed to update game state" },
      { status: 500, headers }
    )
  }
}
