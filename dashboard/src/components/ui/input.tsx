import { ComponentProps } from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Utility .input do DESIGN_BASE — a única família de input do design
        "flex w-full min-w-0 rounded-md border border-hairline bg-surface-card px-3 py-2 text-[13px] text-ink shadow-sm outline-none",
        "placeholder:text-ink-soft selection:bg-brand selection:text-white",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/40",
        "aria-invalid:border-danger aria-invalid:ring-danger/20",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Input }
