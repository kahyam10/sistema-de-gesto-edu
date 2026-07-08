import { ComponentProps } from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Pílulas de status do DESIGN_BASE (§3.3): fundo soft + texto escuro da
// mesma família. Nunca fundo saturado cheio para status.
const badgeVariants = cva(
  "inline-flex items-center justify-center gap-1.5 rounded-full border border-transparent px-2.5 py-0.5 text-[11.5px] font-semibold w-fit whitespace-nowrap shrink-0 tracking-[0.1px] [&>svg]:size-3 [&>svg]:pointer-events-none overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-brand-soft text-brand-700",
        primary: "bg-brand-soft text-brand-700",
        secondary: "bg-surface-muted text-ink-2",
        neutral: "bg-surface-muted text-ink-2",
        destructive: "bg-danger-soft text-danger",
        danger: "bg-danger-soft text-danger",
        success: "bg-success-soft text-[#0A6142]",
        warning: "bg-warning-soft text-[#8B5A06]",
        info: "bg-info-soft text-info",
        accent: "bg-accent-soft text-[#8B6A10]",
        dark: "bg-ink text-white",
        outline: "bg-transparent text-ink-2 border-hairline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
