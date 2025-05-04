"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { validateGameId } from "@/lib/game-utils"
import { useTheme } from "@/hooks/use-theme"

export default function JoinGame() {
  const router = useRouter()
  const { currentColorScheme } = useTheme()
  const [gameId, setGameId] = useState("")
  const [error, setError] = useState("")

  const handleJoinGame = () => {
    setError("")

    if (!gameId.trim()) {
      setError("Please enter a game password")
      return
    }

    if (!validateGameId(gameId)) {
      setError("Invalid game password format")
      return
    }

    router.push(`/game/${gameId}?mode=multi&host=false`)
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Join Game</CardTitle>
          <CardDescription>Enter the game password shared by your friend</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="gameId">Game Password</Label>
            <Input
              id="gameId"
              placeholder="Enter password"
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
            />
            {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-3">
          <Button className={`w-full ${currentColorScheme.primary}`} onClick={handleJoinGame}>
            Join Game
          </Button>
          <Link href="/" className="w-full">
            <Button variant="outline" className="w-full">
              Back
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </main>
  )
}
