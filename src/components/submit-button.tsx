"use client";

import { Loader2 } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { useFormStatus } from "react-dom";

/** A submit button that disables itself and shows a spinner while its parent form's Server Action runs. */
export function SubmitButton({ children, pendingChildren, ...props }: ComponentProps<"button"> & { pendingChildren?: ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" {...props} disabled={pending || props.disabled} aria-busy={pending}>
      {pending ? (pendingChildren ?? <Loader2 className="size-4 animate-spin" aria-hidden />) : children}
    </button>
  );
}
