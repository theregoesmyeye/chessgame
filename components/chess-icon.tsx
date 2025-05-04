import { ChessPieceWhiteKnight } from "./chess-pieces"

interface ChessIconProps {
  size?: number
  className?: string
}

export function ChessIcon({ size = 512, className = "" }: ChessIconProps) {
  return (
    <div
      className={`bg-slate-800 dark:bg-slate-700 rounded-xl p-4 ${className}`}
      style={{ width: size, height: size, maxWidth: "100%" }}
    >
      <ChessPieceWhiteKnight className="w-full h-full text-white" />
    </div>
  )
}
