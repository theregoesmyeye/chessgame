"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Square } from "./square"
import { Loader2 } from "lucide-react"

interface ChessBoardProps {
  position?: string
  selectedSquare?: string | null
  possibleMoves?: string[]
  onSquareClick?: (square: string) => void
  onPieceDrop?: (from: string, to: string) => void
  orientation?: "white" | "black"
  preview?: boolean
  isThinking?: boolean
}

export function ChessBoard({
  position = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR",
  selectedSquare = null,
  possibleMoves = [],
  onSquareClick,
  onPieceDrop,
  orientation = "white",
  preview = false,
  isThinking = false,
}: ChessBoardProps) {
  const [boardArray, setBoardArray] = useState<string[][]>([])
  const [draggedPiece, setDraggedPiece] = useState<{ square: string; piece: string } | null>(null)
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const dragControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const rows = position.split("/")
    const board: string[][] = []

    rows.forEach((row) => {
      const newRow: string[] = []
      for (let i = 0; i < row.length; i++) {
        const char = row[i]
        if (isNaN(Number.parseInt(char))) {
          newRow.push(char)
        } else {
          for (let j = 0; j < Number.parseInt(char); j++) {
            newRow.push("")
          }
        }
      }
      board.push(newRow)
    })

    setBoardArray(board)
  }, [position])

  useEffect(() => {
    return () => {
      if (dragControllerRef.current) {
        dragControllerRef.current.abort()
      }
    }
  }, [])

  const files = ["a", "b", "c", "d", "e", "f", "g", "h"]
  const ranks = ["8", "7", "6", "5", "4", "3", "2", "1"]

  const getSquareName = (fileIndex: number, rankIndex: number) => {
    return `${files[fileIndex]}${ranks[rankIndex]}`
  }

  const isPossibleMove = (square: string) => {
    // Check if the square is in the possible moves array
    return possibleMoves.includes(square)
  }

  const handleDragStart = (square: string, piece: string, e: React.MouseEvent | React.TouchEvent) => {
    if (preview) return

    // Only allow dragging pieces that can move (based on turn)
    if (possibleMoves.length === 0 && !selectedSquare) {
      // Simulate a click to select the piece first and get possible moves
      onSquareClick?.(square)
      return
    }

    if (selectedSquare !== square && selectedSquare !== null) {
      // If another piece is already selected, deselect it first
      onSquareClick?.(selectedSquare)
      return
    }

    setDraggedPiece({ square, piece })

    // Set initial position for the dragged piece
    if (e.type === "mousedown") {
      const mouseEvent = e as React.MouseEvent
      setDragPosition({ x: mouseEvent.clientX, y: mouseEvent.clientY })
    } else if (e.type === "touchstart") {
      const touchEvent = e as React.TouchEvent
      const touch = touchEvent.touches[0]
      setDragPosition({ x: touch.clientX, y: touch.clientY })
      // Prevent scrolling while dragging on touch devices
      e.preventDefault()
    }

    // Create AbortController for this drag session
    dragControllerRef.current = new AbortController()

    // Add event listeners for drag movement and end
    document.addEventListener("mousemove", handleDragMove, { signal: dragControllerRef.current.signal })
    document.addEventListener("touchmove", handleDragMove, { passive: false, signal: dragControllerRef.current.signal })
    document.addEventListener("mouseup", handleDragEnd, { signal: dragControllerRef.current.signal })
    document.addEventListener("touchend", handleDragEnd, { signal: dragControllerRef.current.signal })
  }

  const handleDragMove = (e: MouseEvent | TouchEvent) => {
    if (!draggedPiece) return

    if (e.type === "mousemove") {
      const mouseEvent = e as MouseEvent
      setDragPosition({ x: mouseEvent.clientX, y: mouseEvent.clientY })
    } else if (e.type === "touchmove") {
      const touchEvent = e as TouchEvent
      const touch = touchEvent.touches[0]
      setDragPosition({ x: touch.clientX, y: touch.clientY })
      // Prevent scrolling while dragging on touch devices
      e.preventDefault()
    }
  }

  const handleDragEnd = (e: MouseEvent | TouchEvent) => {
    if (!draggedPiece || !boardRef.current) {
      cleanup()
      return
    }

    // Get the position where the piece was dropped
    let clientX: number, clientY: number

    if (e.type === "mouseup") {
      const mouseEvent = e as MouseEvent
      clientX = mouseEvent.clientX
      clientY = mouseEvent.clientY
    } else {
      const touchEvent = e as TouchEvent
      if (touchEvent.changedTouches.length === 0) {
        cleanup()
        return
      }
      const touch = touchEvent.changedTouches[0]
      clientX = touch.clientX
      clientY = touch.clientY
    }

    // Find the square element under the drop position
    const boardRect = boardRef.current.getBoundingClientRect()
    const squareWidth = boardRect.width / 8
    const squareHeight = boardRect.height / 8

    // Check if drop is within the board
    if (
      clientX < boardRect.left ||
      clientX > boardRect.right ||
      clientY < boardRect.top ||
      clientY > boardRect.bottom
    ) {
      cleanup()
      return
    }

    // Calculate the square coordinates
    const fileIndex = Math.floor((clientX - boardRect.left) / squareWidth)
    const rankIndex = Math.floor((clientY - boardRect.top) / squareHeight)

    // Convert to chess notation based on orientation
    let targetSquare
    if (orientation === "white") {
      targetSquare = getSquareName(fileIndex, rankIndex)
    } else {
      targetSquare = getSquareName(7 - fileIndex, 7 - rankIndex)
    }

    // Check if the move is valid
    if (isPossibleMove(targetSquare)) {
      onPieceDrop?.(draggedPiece.square, targetSquare)
    }

    cleanup()
  }

  const cleanup = () => {
    setDraggedPiece(null)
    setDragPosition(null)
    if (dragControllerRef.current) {
      dragControllerRef.current.abort()
      dragControllerRef.current = null
    }
  }

  const renderBoard = () => {
    const board = []

    // Flip the board if orientation is black
    const displayRanks = orientation === "black" ? [...ranks].reverse() : ranks
    const displayFiles = orientation === "black" ? [...files].reverse() : files

    for (let rankIndex = 0; rankIndex < 8; rankIndex++) {
      for (let fileIndex = 0; fileIndex < 8; fileIndex++) {
        const square = getSquareName(
          orientation === "black" ? 7 - fileIndex : fileIndex,
          orientation === "black" ? 7 - rankIndex : rankIndex,
        )
        const piece = boardArray[rankIndex]?.[fileIndex] || ""

        // Don't render the piece on its original square if it's being dragged
        const isBeingDragged = draggedPiece?.square === square
        const displayPiece = isBeingDragged ? "" : piece

        board.push(
          <Square
            key={square}
            square={square}
            piece={displayPiece}
            isLight={(rankIndex + fileIndex) % 2 === 1}
            isSelected={selectedSquare === square}
            isPossibleMove={isPossibleMove(square)}
            onClick={() => !preview && onSquareClick?.(square)}
            onDragStart={(e) => !preview && piece && handleDragStart(square, piece, e)}
            preview={preview}
          />,
        )
      }
    }

    return board
  }

  return (
    <div className="relative">
      <div
        ref={boardRef}
        className={`grid grid-cols-8 border border-border rounded-md overflow-hidden ${
          preview ? "w-full max-w-[240px] mx-auto opacity-80" : "w-full"
        }`}
        style={{ aspectRatio: "1/1" }}
      >
        {renderBoard()}
      </div>

      {/* Dragged piece */}
      {draggedPiece && dragPosition && (
        <div
          className="fixed pointer-events-none z-50"
          style={{
            left: `${dragPosition.x}px`,
            top: `${dragPosition.y}px`,
            transform: "translate(-50%, -50%)",
            width: boardRef.current ? boardRef.current.clientWidth / 8 : 50,
            height: boardRef.current ? boardRef.current.clientHeight / 8 : 50,
          }}
        >
          <Square square="" piece={draggedPiece.piece} isLight={true} preview={false} isDragging={true} />
        </div>
      )}

      {/* Rank labels (1-8) */}
      <div className="absolute top-0 left-0 h-full flex flex-col justify-around pointer-events-none">
        {(orientation === "white" ? ranks : [...ranks].reverse()).map((rank) => (
          <div key={rank} className="text-xs text-muted-foreground pl-1">
            {rank}
          </div>
        ))}
      </div>

      {/* File labels (a-h) */}
      <div className="absolute bottom-0 left-0 w-full flex justify-around pointer-events-none">
        {(orientation === "white" ? files : [...files].reverse()).map((file) => (
          <div key={file} className="text-xs text-muted-foreground pb-1">
            {file}
          </div>
        ))}
      </div>

      {isThinking && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-md">
          <div className="bg-background p-3 rounded-full shadow-md">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      )}
    </div>
  )
}
