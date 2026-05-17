"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

export function Toaster(props: React.ComponentProps<typeof Sonner>) {
  const { theme = "system" } = useTheme()
  return <Sonner theme={theme as any} {...props} />
}
