"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Share2, Copy, ExternalLink } from "lucide-react"

interface MultiFallbackProps {
  gameId: string
  isHost: boolean
}

export function MultiplayerFallback({ gameId, isHost }: MultiFallbackProps) {
  const [copied, setCopied] = useState(false)

  const copyGameId = () => {
    navigator.clipboard.writeText(gameId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const copyGameLink = () => {
    // Create a full URL that the opponent can use to join directly
    const baseUrl = window.location.origin
    const joinUrl = `${baseUrl}/game/${gameId}?mode=multi&host=false`

    navigator.clipboard.writeText(joinUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5 text-primary" />
          Share Game
        </CardTitle>
        <CardDescription>Invite a friend to play with you</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isHost ? (
          <>
            <p className="text-sm">Share this game link or password with your friend to play together:</p>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Game Password</h3>
              <div className="p-3 bg-muted rounded-md text-center font-mono text-lg">{gameId}</div>
              <Button onClick={copyGameId} variant="outline" className="w-full flex items-center gap-2">
                <Copy className="h-4 w-4" />
                {copied ? "Copied!" : "Copy Password"}
              </Button>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Or share this link</h3>
              <Button onClick={copyGameLink} variant="outline" className="w-full flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                {copied ? "Copied!" : "Copy Game Link"}
              </Button>
            </div>

            <div className="p-3 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-md">
              Waiting for your friend to join...
            </div>
          </>
        ) : (
          <div className="p-3 bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-300 rounded-md">
            You've joined the game! Waiting for the host to make their move.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
