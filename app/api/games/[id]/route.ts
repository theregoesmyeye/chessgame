import { NextResponse } from "next/server"

// In-memory game state storage (will reset on server restart)
const gameStates = new Map<string, any>()

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
    const playerIndex = currentState.players.findIndex((p: any) => p.isHost === data.player.isHost)

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
    // Add a new move
    currentState.moves.push({
      ...data.move,
      timestamp: Date.now(),
    })

    // Update player's last seen timestamp
    const playerIndex = currentState.players.findIndex((p: any) => p.id === data.playerId)

    if (playerIndex >= 0) {
      currentState.players[playerIndex].lastSeen = Date.now()
    }
  } else if (data.type === "ping") {
    // Update player's last seen timestamp
    const playerIndex = currentState.players.findIndex((p: any) => p.isHost === data.isHost)

    if (playerIndex >= 0) {
      currentState.players[playerIndex].lastSeen = Date.now()
    }
  }

  // Update the last updated timestamp
  currentState.lastUpdated = Date.now()

  // Save the updated state
  gameStates.set(gameId, currentState)

  return NextResponse.json(currentState)
}
