"use client";

import { Trash2 } from "lucide-react";
import { useId, useRef } from "react";
import { toast } from "sonner";
import { SubmitButton } from "./submit-button";
import { buttonClass } from "./ui";

/** Delete with a confirmation dialog (native <dialog>: focus trap, Escape to close, backdrop for free). */
export function ConfirmDelete({ action, name }: { action: () => Promise<void>; name: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        aria-label={`Delete ${name}`}
        title="Delete"
        className="flex size-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-danger-soft hover:text-danger sm:size-8"
      >
        <Trash2 className="size-4" aria-hidden />
      </button>
      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        className="m-auto w-[min(92vw,26rem)] rounded-xl border border-line bg-surface p-6 text-foreground backdrop:bg-black/50"
      >
        <h2 id={titleId} className="text-lg font-semibold">
          Delete this item?
        </h2>
        <p className="mt-2 text-sm text-muted">
          <span className="font-medium text-foreground">{name}</span> and its usage history will be permanently removed.
        </p>
        <form
          className="mt-6 flex justify-end gap-3"
          action={async () => {
            await action();
            toast.success(`Deleted ${name}`);
            dialog.current?.close();
          }}
        >
          <button type="button" onClick={() => dialog.current?.close()} className={buttonClass("secondary")}>
            Cancel
          </button>
          <SubmitButton className={buttonClass("destructive")} pendingChildren="Deleting…">
            Delete
          </SubmitButton>
        </form>
      </dialog>
    </>
  );
}
