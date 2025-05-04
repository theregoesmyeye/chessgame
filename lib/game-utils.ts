// In-memory storage for active game IDs
const activeGameIds = new Set<string>()

export function generateGameId(): string {
  // Generate a random 6-character alphanumeric code
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let result = ""
  let attempts = 0
  const maxAttempts = 10 // Prevent infinite loops

  do {
    result = ""
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    attempts++
  } while (activeGameIds.has(result) && attempts < maxAttempts)

  // If we couldn't generate a unique ID after max attempts, add a timestamp suffix
  if (activeGameIds.has(result)) {
    const timestamp = Date.now().toString(36).slice(-4)
    result = result.slice(0, 2) + timestamp
  }

  // Add the new ID to the active set
  activeGameIds.add(result)
  return result
}

export function validateGameId(gameId: string): boolean {
  // Simple validation - 6 character alphanumeric
  return /^[A-Z0-9]{6}$/.test(gameId)
}

export function releaseGameId(gameId: string): void {
  // Remove the game ID from the active set when the game is over
  activeGameIds.delete(gameId)
}
