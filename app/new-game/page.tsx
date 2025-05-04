"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { generateGameId } from "@/lib/game-utils"
import { useTheme } from "@/hooks/use-theme"

export default function NewGame() {
  const router = useRouter()
  const { currentColorScheme } = useTheme()
  const [gameMode, setGameMode] = useState<"single" | "multi">("single")
  const [gameId, setGameId] = useState<string | null>(null)
  const [playerColor, setPlayerColor] = useState<"w" | "b">("w")

  const handleCreateGame = () => {
    const id = generateGameId()
    setGameId(id)

    if (gameMode === "single") {
      router.push(`/game/${id}?mode=single&color=${playerColor}`)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create New Game</CardTitle>
          <CardDescription>Choose game mode and settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Game Mode</h3>
            <RadioGroup
              defaultValue="single"
              className="space-y-4"
              onValueChange={(value) => setGameMode(value as "single" | "multi")}
            >
              <div className="flex items-center space-x-2 border rounded-md p-4">
                <RadioGroupItem value="single" id="single" />
                <Label htmlFor="single" className="flex flex-col cursor-pointer">
                  <span className="font-medium">Single Player</span>
                  <span className="text-sm text-muted-foreground">Play against the computer</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2 border rounded-md p-4">
                <RadioGroupItem value="multi" id="multi" />
                <Label htmlFor="multi" className="flex flex-col cursor-pointer">
                  <span className="font-medium">Multiplayer</span>
                  <span className="text-sm text-muted-foreground">Play with a friend online</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {gameMode === "single" && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Play As</h3>
              <RadioGroup
                defaultValue="w"
                className="grid grid-cols-2 gap-4"
                onValueChange={(value) => setPlayerColor(value as "w" | "b")}
              >
                <div className="flex items-center space-x-2 border rounded-md p-4">
                  <RadioGroupItem value="w" id="white" />
                  <Label htmlFor="white" className="cursor-pointer">
                    White
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-md p-4">
                  <RadioGroupItem value="b" id="black" />
                  <Label htmlFor="black" className="cursor-pointer">
                    Black
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {gameId && gameMode === "multi" && (
            <div className="p-4 bg-muted rounded-md">
              <h3 className="font-medium">Game Password</h3>
              <p className="text-sm text-muted-foreground mb-2">Share this password with your opponent</p>
              <div className="p-3 bg-background border rounded-md text-center font-mono text-lg">{gameId}</div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-3">
          {!gameId ? (
            <Button className={`w-full ${currentColorScheme.primary}`} onClick={handleCreateGame}>
              Create Game
            </Button>
          ) : gameMode === "multi" ? (
            <Link href={`/game/${gameId}?mode=multi&host=true`} className="w-full">
              <Button className={`w-full ${currentColorScheme.primary}`}>Start Game</Button>
            </Link>
          ) : null}
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
