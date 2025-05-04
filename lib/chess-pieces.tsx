import type React from "react"
import {
  type ChessPieceProps,
  ChessPieceWhiteKing,
  ChessPieceWhiteQueen,
  ChessPieceWhiteRook,
  ChessPieceWhiteBishop,
  ChessPieceWhiteKnight,
  ChessPieceWhitePawn,
  ChessPieceBlackKing,
  ChessPieceBlackQueen,
  ChessPieceBlackRook,
  ChessPieceBlackBishop,
  ChessPieceBlackKnight,
  ChessPieceBlackPawn,
} from "@/components/chess-pieces"

export function getPieceComponent(piece: string): React.ComponentType<ChessPieceProps> | null {
  switch (piece) {
    case "K":
      return ChessPieceWhiteKing
    case "Q":
      return ChessPieceWhiteQueen
    case "R":
      return ChessPieceWhiteRook
    case "B":
      return ChessPieceWhiteBishop
    case "N":
      return ChessPieceWhiteKnight
    case "P":
      return ChessPieceWhitePawn
    case "k":
      return ChessPieceBlackKing
    case "q":
      return ChessPieceBlackQueen
    case "r":
      return ChessPieceBlackRook
    case "b":
      return ChessPieceBlackBishop
    case "n":
      return ChessPieceBlackKnight
    case "p":
      return ChessPieceBlackPawn
    default:
      return null
  }
}
