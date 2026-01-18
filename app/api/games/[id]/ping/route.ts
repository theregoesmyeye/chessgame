import { NextResponse } from "next/server"
import { getGame, saveGame } from "@/lib/supabase"

// Add cache control headers to prevent caching
const headers = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const gameId = params.id
  const data = await request.json()

  try {
    // Get current game state from Supabase
    const currentState = await getGame(gameId)

    if (!currentState) {
      return NextResponse.json({ error: "Game not found" }, { status: 404, headers })
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

    // Save the updated state to Supabase
    await saveGame(currentState)

    return NextResponse.json({ success: true }, { headers })
  } catch (error) {
    console.error("Error updating ping:", error)
    return NextResponse.json(
      { error: "Failed to update ping" },
      { status: 500, headers }
    )
  }
}
