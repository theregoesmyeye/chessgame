import { NextResponse } from "next/server"

// In-memory game state storage (will reset on server restart)
const gameStates = new Map<string, any>()

// Add cache control headers to prevent caching
const headers = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const gameId = params.id

  // Return the current game state or an empty state
  return NextResponse.json(
    gameStates.get(gameId) || {
      id: gameId,
      players: [],
      moves: [],
      lastUpdated: Date.now(),
    },
    { headers },
  )
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const gameId = params.id
  const data = await request.json()

  console.log("POST request to game API:", gameId, data)

  // Get current game state or initialize a new one
  const currentState = gameStates.get(gameId) || {
    id: gameId,
    players: [],
    moves: [],
    lastUpdated: Date.now(),
  }

  // Update the game state based on the action type
  if (data.type === "join") {
    console.log("Player joining:", data.player)
    // Add or update player
    const playerIndex = currentState.players.findIndex((p: any) => p.id === data.player.id)

    if (playerIndex >= 0) {
      currentState.players[playerIndex] = {
        ...currentState.players[playerIndex],
        ...data.player,
        lastSeen: Date.now(),
      }
    } else {
      currentState.players.push({
        ...data.player,
        lastSeen: Date.now(),
      })
    }

    console.log("Updated players:", currentState.players)
  } else if (data.type === "move") {
    console.log("New move:", data.move)

    // Ensure the move has a timestamp
    const moveWithTimestamp = {
      ...data.move,
      timestamp: data.move.timestamp || Date.now(),
    }

    // Add a new move
    currentState.moves.push(moveWithTimestamp)

    // Update player's last seen timestamp
    const playerIndex = currentState.players.findIndex((p: any) => p.id === data.playerId)

    if (playerIndex >= 0) {
      currentState.players[playerIndex].lastSeen = Date.now()
    }
  } else if (data.type === "ping") {
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
  }

  // Update the last updated timestamp
  currentState.lastUpdated = Date.now()

  // Save the updated state
  gameStates.set(gameId, currentState)

  return NextResponse.json(currentState, { headers })
}
