import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Only create client if we have valid URLs (not placeholders)
const isValidUrl = supabaseUrl && supabaseUrl.startsWith('http') && !supabaseUrl.includes('your_supabase')
const isValidKey = supabaseKey && !supabaseKey.includes('your_supabase')

// Create a single supabase client for interacting with your database
export const supabase = (isValidUrl && isValidKey) ? createClient(supabaseUrl, supabaseKey) : null

export interface GameState {
  id: string
  players: Array<{
    id: string
    isHost: boolean
    lastSeen: number
  }>
  moves: Array<{
    from: string
    to: string
    playerId: string
    timestamp: number
    turn: string
  }>
  currentTurn: string
  lastUpdated: number
}

export async function getGame(gameId: string): Promise<GameState | null> {
  if (!supabase) {
    throw new Error('Supabase client not initialized. Please check environment variables.')
  }

  const { data, error } = await supabase
    .from('chess_games')
    .select('*')
    .eq('id', gameId)
    .single()

  if (error || !data) {
    return null
  }

  return {
    id: data.id,
    players: data.players || [],
    moves: data.moves || [],
    currentTurn: data.currentTurn || 'w',
    lastUpdated: data.lastUpdated || Date.now(),
  }
}

export async function saveGame(gameState: GameState): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase client not initialized. Please check environment variables.')
  }

  const { error } = await supabase
    .from('chess_games')
    .upsert({
      id: gameState.id,
      players: gameState.players,
      moves: gameState.moves,
      currentTurn: gameState.currentTurn,
      lastUpdated: gameState.lastUpdated,
    })

  if (error) {
    console.error('Error saving game:', error)
    throw error
  }
}
