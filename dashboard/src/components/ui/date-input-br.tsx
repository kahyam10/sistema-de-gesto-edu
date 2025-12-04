import * as React from "react";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";

interface DateInputBRProps {
  id?: string;
  value: string; // formato ISO: YYYY-MM-DD
  onChange: (value: string) => void;
  min?: string; // formato ISO: YYYY-MM-DD
  max?: string; // formato ISO: YYYY-MM-DD
  required?: boolean;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

/**
 * Converte data ISO (YYYY-MM-DD) para formato brasileiro (DD/MM/AAAA)
 */
function isoToBR(isoDate: string): string {
  if (!isoDate) return "";
  const parts = isoDate.split("-");
  if (parts.length !== 3) return "";
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
}

/**
 * Converte data brasileira (DD/MM/AAAA) para formato ISO (YYYY-MM-DD)
 */
function brToISO(brDate: string): string {
  if (!brDate) return "";
  // Remove caracteres não numéricos exceto /
  const cleaned = brDate.replace(/[^\d/]/g, "");
  const parts = cleaned.split("/");
  if (parts.length !== 3) return "";
  const [day, month, year] = parts;
  if (!day || !month || !year) return "";
  if (year.length !== 4) return "";
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

/**
 * Valida se a data está no formato correto e é válida
 */
function isValidDate(brDate: string): boolean {
  const isoDate = brToISO(brDate);
  if (!isoDate) return false;
  const date = new Date(isoDate);
  return !isNaN(date.getTime());
}

/**
 * Aplica máscara de data brasileira (DD/MM/AAAA)
 */
function applyDateMask(value: string): string {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, "");
  
  // Aplica a máscara
  let masked = "";
  for (let i = 0; i < numbers.length && i < 8; i++) {
    if (i === 2 || i === 4) {
      masked += "/";
    }
    masked += numbers[i];
  }
  
  return masked;
}

function DateInputBR({
  id,
  value,
  onChange,
  min,
  max,
  required,
  disabled,
  className,
  placeholder = "dd/mm/aaaa",
}: DateInputBRProps) {
  const [displayValue, setDisplayValue] = React.useState(() => isoToBR(value));
  const [isValid, setIsValid] = React.useState(true);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Atualiza o valor exibido quando o valor externo muda
  React.useEffect(() => {
    setDisplayValue(isoToBR(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const maskedValue = applyDateMask(rawValue);
    setDisplayValue(maskedValue);

    // Se a data estiver completa (10 caracteres: DD/MM/AAAA), valida e converte
    if (maskedValue.length === 10) {
      if (isValidDate(maskedValue)) {
        const isoValue = brToISO(maskedValue);
        
        // Verifica limites min/max
        let isWithinBounds = true;
        if (min && isoValue < min) isWithinBounds = false;
        if (max && isoValue > max) isWithinBounds = false;
        
        setIsValid(isWithinBounds);
        if (isWithinBounds) {
          onChange(isoValue);
        }
      } else {
        setIsValid(false);
      }
    } else if (maskedValue.length === 0) {
      // Limpa o valor se o campo estiver vazio
      setIsValid(true);
      onChange("");
    } else {
      setIsValid(true); // Ainda digitando
    }
  };

  const handleBlur = () => {
    // Se a data não estiver completa no blur, valida
    if (displayValue && displayValue.length < 10) {
      setIsValid(false);
    }
  };

  // Abre o date picker nativo ao clicar no ícone
  const handleIconClick = () => {
    if (inputRef.current && !disabled) {
      // Cria um input date temporário para usar o picker nativo
      const tempInput = document.createElement("input");
      tempInput.type = "date";
      tempInput.value = value || "";
      if (min) tempInput.min = min;
      if (max) tempInput.max = max;
      tempInput.style.position = "absolute";
      tempInput.style.opacity = "0";
      tempInput.style.pointerEvents = "none";
      document.body.appendChild(tempInput);
      
      tempInput.addEventListener("change", (e) => {
        const target = e.target as HTMLInputElement;
        if (target.value) {
          onChange(target.value);
          setDisplayValue(isoToBR(target.value));
          setIsValid(true);
        }
        document.body.removeChild(tempInput);
      });
      
      tempInput.addEventListener("blur", () => {
        setTimeout(() => {
          if (document.body.contains(tempInput)) {
            document.body.removeChild(tempInput);
          }
        }, 100);
      });
      
      tempInput.showPicker();
    }
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        id={id}
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        maxLength={10}
        className={cn(
          "flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none md:text-sm pr-9",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          "placeholder:text-muted-foreground",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
          isValid 
            ? "border-input" 
            : "border-destructive ring-destructive/20 dark:ring-destructive/40",
          className
        )}
      />
      <button
        type="button"
        onClick={handleIconClick}
        disabled={disabled}
        className={cn(
          "absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors",
          "disabled:pointer-events-none disabled:opacity-50"
        )}
        tabIndex={-1}
      >
        <CalendarIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

export { DateInputBR, isoToBR, brToISO };
