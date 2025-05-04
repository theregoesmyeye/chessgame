"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { useTheme } from "@/hooks/use-theme"

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const { currentColorScheme } = useTheme()

  useEffect(() => {
    // Check if on iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(isIOSDevice)

    // Listen for the beforeinstallprompt event
    window.addEventListener("beforeinstallprompt", (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault()
      // Stash the event so it can be triggered later
      setDeferredPrompt(e)
      setIsInstallable(true)
    })

    // Listen for the appinstalled event
    window.addEventListener("appinstalled", () => {
      // Clear the deferredPrompt
      setDeferredPrompt(null)
      setIsInstallable(false)
    })

    return () => {
      window.removeEventListener("beforeinstallprompt", () => {})
      window.removeEventListener("appinstalled", () => {})
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    // Show the install prompt
    deferredPrompt.prompt()

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice

    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null)
    setIsInstallable(false)
  }

  if (!isInstallable && !isIOS) return null

  return (
    <div className="mt-6 p-4 bg-muted rounded-md text-foreground">
      {isInstallable ? (
        <div className="flex flex-col items-center space-y-3">
          <p className="text-sm">Install this app on your device for a better experience</p>
          <Button onClick={handleInstallClick} className={`flex items-center gap-2 ${currentColorScheme.primary}`}>
            <Download className="h-4 w-4" />
            Install App
          </Button>
        </div>
      ) : isIOS ? (
        <div className="text-sm text-center">
          <p>To install this app on your iOS device:</p>
          <p className="mt-2">
            Tap{" "}
            <span className="inline-block px-2">
              Share <span className="text-xs">⎋</span>
            </span>{" "}
            then &quot;Add to Home Screen&quot;
          </p>
        </div>
      ) : null}
    </div>
  )
}
