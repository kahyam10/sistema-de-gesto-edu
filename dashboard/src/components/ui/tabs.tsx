"use client"

import { ComponentProps } from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        // Tabs sublinhadas do DESIGN_BASE (§3.20)
        "-mb-px inline-flex w-fit flex-wrap items-center gap-0.5 border-b border-hairline",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex items-center gap-1.5 border-b-2 border-transparent px-4 py-2.5 text-[13px] font-semibold whitespace-nowrap text-ink-muted transition-colors duration-180 hover:text-ink-2 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:border-brand data-[state=active]:text-brand [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
