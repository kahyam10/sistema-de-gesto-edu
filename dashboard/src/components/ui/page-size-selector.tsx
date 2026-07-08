import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface PageSizeSelectorProps {
  value: number
  onChange: (value: number) => void
  options?: number[]
  className?: string
}

export function PageSizeSelector({
  value,
  onChange,
  options = [10, 20, 50, 100],
  className,
}: PageSizeSelectorProps) {
  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          Itens por página:
        </span>
        <Select
          value={value.toString()}
          onValueChange={(v) => onChange(parseInt(v, 10))}
        >
          <SelectTrigger className="w-[70px]" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option} value={option.toString()}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
