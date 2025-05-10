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

  console.log("Move request:", data)

  // Get current game state
  const currentState = gameStates.get(gameId)

  if (!currentState) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 })
  }

  // Validate the move
  const playerIndex = currentState.players.findIndex((p: any) => p.id === data.playerId)

  if (playerIndex < 0) {
    return NextResponse.json({ error: "Player not found" }, { status: 400 })
  }

  const player = currentState.players[playerIndex]

  // Check if it's the player's turn
  const isWhiteTurn = currentState.currentTurn === "w"
  const isPlayerTurn = (player.isHost && isWhiteTurn) || (!player.isHost && !isWhiteTurn)

  if (!isPlayerTurn) {
    return NextResponse.json({ error: "Not your turn" }, { status: 400 })
  }

  // Add the move
  currentState.moves.push({
    from: data.from,
    to: data.to,
    playerId: data.playerId,
    timestamp: data.timestamp,
    turn: data.turn,
  })

  // Update the current turn
  currentState.currentTurn = data.nextTurn

  // Update player's last seen timestamp
  currentState.players[playerIndex].lastSeen = Date.now()

  // Update the last updated timestamp
  currentState.lastUpdated = Date.now()

  // Save the updated state
  gameStates.set(gameId, currentState)

  return NextResponse.json(
    {
      success: true,
      currentTurn: currentState.currentTurn,
    },
    { headers },
  )
}
