import { supabase } from "./supabase"

export interface GameState {
  id: string
  players: any[]
  moves: any[]
  currentTurn: "w" | "b"
  lastUpdated: number
}

export async function getGame(gameId: string): Promise<GameState | null> {
  const { data, error } = await supabase
    .from("chess_games")
    .select("*")
    .eq("id", gameId)
    .single()

  if (error) {
    if (error.code === "PGRST116") {
      // No rows returned
      return null
    }
    throw error
  }

  return {
    id: data.id,
    players: data.players || [],
    moves: data.moves || [],
    currentTurn: data.currentTurn || "w",
    lastUpdated: data.lastUpdated || Date.now(),
  }
}

export async function upsertGame(gameState: GameState): Promise<void> {
  const { error } = await supabase
    .from("chess_games")
    .upsert(
      {
        id: gameState.id,
        players: gameState.players,
        moves: gameState.moves,
        currentTurn: gameState.currentTurn,
        lastUpdated: gameState.lastUpdated,
      },
      {
        onConflict: "id",
      }
    )

  if (error) {
    throw error
  }
}

export async function updateGame(gameId: string, updates: Partial<GameState>): Promise<void> {
  const { error } = await supabase
    .from("chess_games")
    .update({
      ...updates,
      lastUpdated: Date.now(),
    })
    .eq("id", gameId)

  if (error) {
    throw error
  }
}