import { ComponentProps } from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Variantes com as classes exatas do DESIGN_BASE (§3.2), mantendo a API shadcn.
// default = primary (azul cheio) · secondary = soft · destructive = danger
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-sm border font-semibold leading-tight tracking-[0.05px] transition-colors duration-180 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:shrink-0 shrink-0 outline-none focus:ring-2 focus:ring-brand/40 focus:ring-offset-1",
  {
    variants: {
      variant: {
        default: "bg-brand text-white border-transparent hover:bg-brand-hover",
        destructive: "bg-danger text-white border-transparent hover:opacity-90",
        outline: "bg-white text-ink-2 border-hairline-strong hover:bg-surface-alt",
        secondary: "bg-brand-soft text-brand-700 border-transparent hover:bg-brand-100",
        ghost: "bg-transparent text-ink-2 border-transparent hover:bg-surface-alt",
        link: "text-brand border-transparent underline-offset-4 hover:underline",
      },
      size: {
        default: "px-3.5 py-1.5 text-[13px] [&_svg:not([class*='size-'])]:size-3.5",
        sm: "px-2.5 py-1 text-xs [&_svg:not([class*='size-'])]:size-3",
        lg: "px-[18px] py-[11px] text-sm [&_svg:not([class*='size-'])]:size-4",
        icon: "h-[30px] w-[30px] p-0 [&_svg:not([class*='size-'])]:size-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
