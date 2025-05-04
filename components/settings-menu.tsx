"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTheme, type ThemeMode, type ThemeColor } from "@/hooks/use-theme"
import { Sun, Moon, Monitor, Palette } from "lucide-react"

interface SettingsMenuProps {
  onClose: () => void
}

export function SettingsMenu({ onClose }: SettingsMenuProps) {
  const { theme, setTheme, color, setColor } = useTheme()

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Settings</CardTitle>
        <CardDescription>Customize your game experience</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="appearance">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="gameplay">Gameplay</TabsTrigger>
          </TabsList>

          <TabsContent value="appearance" className="space-y-6 pt-4">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Mode</h3>
              <RadioGroup
                value={theme}
                onValueChange={(value) => setTheme(value as ThemeMode)}
                className="grid grid-cols-3 gap-4"
              >
                <div className="flex flex-col items-center space-y-2 border rounded-md p-4">
                  <Sun className="h-5 w-5" />
                  <RadioGroupItem value="light" id="light" className="sr-only" />
                  <Label htmlFor="light" className="cursor-pointer text-sm">
                    Light
                  </Label>
                </div>
                <div className="flex flex-col items-center space-y-2 border rounded-md p-4">
                  <Moon className="h-5 w-5" />
                  <RadioGroupItem value="dark" id="dark" className="sr-only" />
                  <Label htmlFor="dark" className="cursor-pointer text-sm">
                    Dark
                  </Label>
                </div>
                <div className="flex flex-col items-center space-y-2 border rounded-md p-4">
                  <Monitor className="h-5 w-5" />
                  <RadioGroupItem value="system" id="system" className="sr-only" />
                  <Label htmlFor="system" className="cursor-pointer text-sm">
                    System
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Color Theme
              </h3>
              <RadioGroup
                value={color}
                onValueChange={(value) => setColor(value as ThemeColor)}
                className="grid grid-cols-2 gap-4"
              >
                <ThemeOption value="classic" label="Classic" colors={["bg-slate-200", "bg-slate-400"]} />
                <ThemeOption value="blue" label="Blue" colors={["bg-sky-100", "bg-sky-500"]} />
                <ThemeOption value="green" label="Green" colors={["bg-emerald-100", "bg-emerald-500"]} />
                <ThemeOption value="purple" label="Purple" colors={["bg-violet-100", "bg-violet-400"]} />
                <ThemeOption value="orange" label="Orange" colors={["bg-amber-100", "bg-amber-400"]} />
              </RadioGroup>
            </div>
          </TabsContent>

          <TabsContent value="gameplay" className="space-y-6 pt-4">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Sound Effects</h3>
              <div className="flex items-center justify-between">
                <Label htmlFor="sound-effects" className="cursor-pointer">
                  Enable sound effects
                </Label>
                <Switch id="sound-effects" defaultChecked />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium">Accessibility</h3>
              <div className="flex items-center justify-between">
                <Label htmlFor="high-contrast" className="cursor-pointer">
                  High contrast pieces
                </Label>
                <Switch id="high-contrast" />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="move-hints" className="cursor-pointer">
                  Show move hints
                </Label>
                <Switch id="move-hints" defaultChecked />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter>
        <Button onClick={onClose} className="w-full">
          Save & Close
        </Button>
      </CardFooter>
    </Card>
  )
}

interface ThemeOptionProps {
  value: string
  label: string
  colors: string[]
}

function ThemeOption({ value, label, colors }: ThemeOptionProps) {
  return (
    <div className="border rounded-md p-3 flex flex-col space-y-2">
      <RadioGroupItem value={value} id={value} className="sr-only" />
      <div className="flex justify-center gap-1 mb-1">
        {colors.map((color, index) => (
          <div key={index} className={`w-5 h-5 rounded-sm ${color}`}></div>
        ))}
      </div>
      <Label htmlFor={value} className="cursor-pointer text-center text-sm">
        {label}
      </Label>
    </div>
  )
}
