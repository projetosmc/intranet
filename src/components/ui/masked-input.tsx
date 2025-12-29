import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type MaskType = "phone" | "cpf" | "cnpj" | "cep" | "date" | "time" | "currency";

interface MaskedInputProps extends Omit<React.ComponentProps<"input">, "onChange"> {
  mask?: MaskType;
  customMask?: (value: string) => string;
  onChange?: (value: string, rawValue: string) => void;
}

// Máscaras pré-definidas
const masks: Record<MaskType, { format: (value: string) => string; maxLength: number; placeholder: string }> = {
  phone: {
    format: (value: string): string => {
      const numbers = value.replace(/\D/g, "").slice(0, 11);
      if (numbers.length <= 2) {
        return numbers.length > 0 ? `(${numbers}` : "";
      } else if (numbers.length <= 7) {
        return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
      } else {
        return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
      }
    },
    maxLength: 15,
    placeholder: "(11) 99999-9999",
  },
  cpf: {
    format: (value: string): string => {
      const numbers = value.replace(/\D/g, "").slice(0, 11);
      if (numbers.length <= 3) {
        return numbers;
      } else if (numbers.length <= 6) {
        return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
      } else if (numbers.length <= 9) {
        return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
      } else {
        return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9)}`;
      }
    },
    maxLength: 14,
    placeholder: "000.000.000-00",
  },
  cnpj: {
    format: (value: string): string => {
      const numbers = value.replace(/\D/g, "").slice(0, 14);
      if (numbers.length <= 2) {
        return numbers;
      } else if (numbers.length <= 5) {
        return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
      } else if (numbers.length <= 8) {
        return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
      } else if (numbers.length <= 12) {
        return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;
      } else {
        return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12)}`;
      }
    },
    maxLength: 18,
    placeholder: "00.000.000/0000-00",
  },
  cep: {
    format: (value: string): string => {
      const numbers = value.replace(/\D/g, "").slice(0, 8);
      if (numbers.length <= 5) {
        return numbers;
      } else {
        return `${numbers.slice(0, 5)}-${numbers.slice(5)}`;
      }
    },
    maxLength: 9,
    placeholder: "00000-000",
  },
  date: {
    format: (value: string): string => {
      const numbers = value.replace(/\D/g, "").slice(0, 8);
      if (numbers.length <= 2) {
        return numbers;
      } else if (numbers.length <= 4) {
        return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
      } else {
        return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4)}`;
      }
    },
    maxLength: 10,
    placeholder: "DD/MM/AAAA",
  },
  time: {
    format: (value: string): string => {
      const numbers = value.replace(/\D/g, "").slice(0, 4);
      if (numbers.length <= 2) {
        return numbers;
      } else {
        return `${numbers.slice(0, 2)}:${numbers.slice(2)}`;
      }
    },
    maxLength: 5,
    placeholder: "HH:MM",
  },
  currency: {
    format: (value: string): string => {
      const numbers = value.replace(/\D/g, "");
      if (!numbers) return "";
      
      const cents = parseInt(numbers, 10);
      const formatted = (cents / 100).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      
      return `R$ ${formatted}`;
    },
    maxLength: 20,
    placeholder: "R$ 0,00",
  },
};

const MaskedInput = React.forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ className, mask, customMask, onChange, value, placeholder, maxLength, ...props }, ref) => {
    const maskConfig = mask ? masks[mask] : null;
    
    const formatValue = React.useCallback(
      (inputValue: string): string => {
        if (customMask) {
          return customMask(inputValue);
        }
        if (maskConfig) {
          return maskConfig.format(inputValue);
        }
        return inputValue;
      },
      [customMask, maskConfig]
    );

    const getRawValue = (inputValue: string): string => {
      return inputValue.replace(/\D/g, "");
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const formatted = formatValue(inputValue);
      const raw = getRawValue(formatted);
      
      onChange?.(formatted, raw);
    };

    return (
      <Input
        ref={ref}
        className={cn(className)}
        value={value}
        onChange={handleChange}
        placeholder={placeholder || maskConfig?.placeholder}
        maxLength={maxLength || maskConfig?.maxLength}
        {...props}
      />
    );
  }
);

MaskedInput.displayName = "MaskedInput";

export { MaskedInput, masks };
export type { MaskType, MaskedInputProps };
