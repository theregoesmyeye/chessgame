import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // We no longer need to handle Socket.IO polling requests
  return NextResponse.next()
}

// We no longer need a matcher for Socket.IO paths
export const config = {
  matcher: [],
}
