"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Copy, Wifi, WifiOff, Clock } from "lucide-react"
import { useState } from "react"

interface GameInfoProps {
  connected: boolean
  waitingForOpponent: boolean
  opponent: string | null
  gameId: string
  turn: string
  isHost: boolean
  isPlayerTurn: boolean
}

export function GameInfo({
  connected,
  waitingForOpponent,
  opponent,
  gameId,
  turn,
  isHost,
  isPlayerTurn,
}: GameInfoProps) {
  const [copied, setCopied] = useState(false)

  const copyGameId = () => {
    navigator.clipboard.writeText(gameId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Badge variant={connected ? "default" : "destructive"} className="flex items-center gap-1">
          {connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          {connected ? "Connected" : "Disconnected"}
        </Badge>

        <Badge variant="outline" className="flex items-center gap-1">
          {isHost ? "You: White" : "You: Black"}
        </Badge>
      </div>

      {waitingForOpponent ? (
        <div className="p-3 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-md flex items-center">
          <Clock className="h-4 w-4 mr-2 animate-pulse" />
          Waiting for opponent to join...
        </div>
      ) : opponent ? (
        <div
          className={`p-3 rounded-md ${
            isPlayerTurn
              ? "bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-300"
              : "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300"
          }`}
        >
          {isPlayerTurn ? "Your turn" : "Opponent's turn"}
        </div>
      ) : null}

      {isHost && waitingForOpponent && (
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground flex-1 truncate">
            Password: <span className="font-mono">{gameId}</span>
          </div>
          <Button size="sm" variant="outline" onClick={copyGameId}>
            {copied ? "Copied!" : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      )}
    </div>
  )
}
