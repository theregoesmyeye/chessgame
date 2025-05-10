import { NextResponse } from "next/server"

// In-memory game state storage (will reset on server restart)
const gameStates = new Map<string, any>()

// Add cache control headers to prevent caching
const headers = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const gameId = params.id
  const data = await request.json()

  // Get current game state
  const currentState = gameStates.get(gameId)

  if (!currentState) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 })
  }

  // Update player's last seen timestamp
  const playerIndex = currentState.players.findIndex((p: any) => p.id === data.playerId)

  if (playerIndex >= 0) {
    currentState.players[playerIndex].lastSeen = Date.now()
  } else {
    // If player not found, add them
    currentState.players.push({
      id: data.playerId,
      isHost: data.isHost,
      lastSeen: Date.now(),
    })
  }

  // Clean up inactive players (not seen in the last 30 seconds)
  currentState.players = currentState.players.filter((p: any) => Date.now() - p.lastSeen < 30000)

  // Update the last updated timestamp
  currentState.lastUpdated = Date.now()

  // Save the updated state
  gameStates.set(gameId, currentState)

  return NextResponse.json({ success: true }, { headers })
}
