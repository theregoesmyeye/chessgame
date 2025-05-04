import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChessBoard } from "@/components/chess-board"
import { InstallPWA } from "@/components/install-pwa"
import { register } from "./sw"

// Register service worker
register()

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Chess Game</h1>
        <p className="text-muted-foreground">Play chess online with friends or against a bot</p>

        <div className="pt-4 flex flex-col space-y-4">
          <Link href="/new-game" className="w-full">
            <Button className="w-full py-6 text-lg">New Game</Button>
          </Link>
          <Link href="/join-game" className="w-full">
            <Button variant="outline" className="w-full py-6 text-lg">
              Join Game
            </Button>
          </Link>
        </div>

        <div className="pt-8">
          <ChessBoard preview />
        </div>

        <InstallPWA />
      </div>
    </main>
  )
}
