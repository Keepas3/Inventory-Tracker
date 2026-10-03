"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

const MESSAGES: Record<string, string> = {
  added: "Item added",
  saved: "Changes saved",
  scanned: "Items added from your scan",
};

/**
 * Server Actions redirect with `?toast=added` after a save; this shows the matching toast once,
 * then strips the param so a refresh or shared link doesn't repeat it.
 */
export function ToastFromQuery() {
  const params = useSearchParams();
  const pathname = usePathname();
  const key = params.get("toast");

  useEffect(() => {
    if (!key || !(key in MESSAGES)) return;
    toast.success(MESSAGES[key]);
    const next = new URLSearchParams(params.toString());
    next.delete("toast");
    const qs = next.toString();
    window.history.replaceState(null, "", qs ? `${pathname}?${qs}` : pathname);
  }, [key, params, pathname]);

  return null;
}
