import { ComponentProps } from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-md border border-hairline bg-surface-card px-3 py-2 text-[13px] text-ink shadow-sm outline-none",
        "placeholder:text-ink-soft",
        "focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/40",
        "aria-invalid:border-danger aria-invalid:ring-danger/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
