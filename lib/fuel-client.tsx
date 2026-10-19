"use client";

import { useEffect, useState } from "react";
import { isFuelQuote, SAMPLE_QUOTE, type FuelQuote } from "@/lib/fuel";

export function useFuelQuote(): FuelQuote {
  const [quote, setQuote] = useState<FuelQuote>(SAMPLE_QUOTE);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/fuel")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: unknown) => {
        if (!cancelled && isFuelQuote(data)) setQuote(data);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return quote;
}
