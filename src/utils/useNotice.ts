import { useEffect, useRef, useState } from "react";
import type { AlertTone } from "@/components/primitives/Alert";

/**
 * A result shown where it happened (PRINCIPLES, When things go wrong), for
 * one place on a page or several (`where`). Success fades after five seconds,
 * like a toast; anything else stays until the next notice. Each notice has a
 * new `key`, so the same message twice is a new alert and is read out again.
 */
export function useNotice<Where extends string>() {
  const [notice, setNotice] = useState<{ where: Where; tone: AlertTone; message: string; key: number } | null>(null);
  const count = useRef(0);
  useEffect(() => {
    if (notice?.tone !== "success") return;
    const timer = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(timer);
  }, [notice]);
  const say = (where: Where, tone: AlertTone, message: string) => setNotice({ where, tone, message, key: ++count.current });
  return { notice, say };
}
