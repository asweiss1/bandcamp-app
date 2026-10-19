"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";

export function PriceField({
  initial,
  placeholder,
  label,
  onCommit,
}: {
  initial: string;
  placeholder: string;
  label: string;
  onCommit: (price: number | null) => void;
}) {
  const [text, setText] = useState(initial);

  function commit() {
    const trimmed = text.trim();
    onCommit(trimmed ? Number(trimmed) : null);
  }

  return (
    <label className="flex items-center gap-2 text-xs text-muted-foreground">
      $/gal for this leg
      <Input
        className="h-8 w-28"
        inputMode="decimal"
        placeholder={placeholder}
        value={text}
        aria-label={label}
        onChange={(event) => setText(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
        }}
      />
    </label>
  );
}
