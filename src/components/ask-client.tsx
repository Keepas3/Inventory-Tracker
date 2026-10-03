"use client";

import { SendHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Button, Card, inputClass } from "./ui";

const EXAMPLES = ["What needs attention this month?", "Do I have a spare HDMI cable?", "What's my total value in Home lab gear?", "What should I restock soon?"];

interface Turn {
  question: string;
  answer?: string;
  error?: string;
}

function TypingDots() {
  return (
    <span role="status" aria-label="Checking your inventory" className="inline-flex items-center gap-1 py-1">
      {[0, 150, 300].map((delay) => (
        <span key={delay} className="size-1.5 animate-bounce rounded-full bg-muted" style={{ animationDelay: `${delay}ms` }} />
      ))}
    </span>
  );
}

interface Props {
  aiEnabled: boolean;
  /** The owner (not a demo visitor) gets setup instructions when AI isn't configured. */
  showSetupHint: boolean;
}

export function AskClient({ aiEnabled, showSetupHint }: Props) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  // Keep the newest message in view as answers arrive.
  useEffect(() => {
    if (turns.length > 0) end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns]);

  async function ask(q: string) {
    const text = q.trim();
    if (!text || busy) return;
    setQuestion("");
    setBusy(true);
    setTurns((t) => [...t, { question: text }]);
    let patch: Partial<Turn>;
    try {
      const res = await fetch("/api/ai/ask", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: text }) });
      const json = await res.json();
      patch = res.ok ? { answer: json.answer } : { error: json.error ?? "Something went wrong." };
    } catch {
      patch = { error: "Couldn't reach the server. Check your connection and try again." };
    }
    setTurns((t) => t.map((turn, i) => (i === t.length - 1 ? { ...turn, ...patch } : turn)));
    setBusy(false);
  }

  return (
    <div className="space-y-6">
      {!aiEnabled && (
        <p role="status" className="rounded-lg bg-warn-soft px-4 py-3 text-sm text-warn">
          {showSetupHint ? (
            <>
              AI isn&apos;t configured on this server. Add <code>ANTHROPIC_API_KEY</code> to <code>.env.local</code> and restart.
            </>
          ) : (
            "AI features are paused on this deployment right now. Check back soon."
          )}
        </p>
      )}

      <div className="space-y-5" aria-live="polite">
        {turns.map((t, i) => (
          <div key={i} className="space-y-2">
            <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-brand px-4 py-2 text-sm text-white">{t.question}</p>
            <Card className="max-w-[92%] px-4 py-3 text-sm">
              {t.answer ? (
                <div className="space-y-2 leading-relaxed [&_li]:my-0.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5">
                  <ReactMarkdown>{t.answer}</ReactMarkdown>
                </div>
              ) : t.error ? (
                <span role="alert" className="text-danger">
                  {t.error}
                </span>
              ) : (
                <TypingDots />
              )}
            </Card>
          </div>
        ))}
        <div ref={end} />
      </div>

      {turns.length === 0 && (
        <div>
          <p className="mb-2 text-sm text-muted">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((e) => (
              <button
                key={e}
                onClick={() => ask(e)}
                disabled={!aiEnabled || busy}
                className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-surface-2 disabled:opacity-50"
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(question);
        }}
        className="sticky bottom-4 flex gap-2 rounded-xl border border-line bg-background/90 p-2 shadow-sm backdrop-blur"
      >
        <label htmlFor="question" className="sr-only">
          Your question
        </label>
        <input
          id="question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          maxLength={500}
          placeholder={aiEnabled ? "Ask about what you own…  (Enter to send)" : "AI is unavailable right now"}
          disabled={!aiEnabled}
          autoComplete="off"
          className={`${inputClass} border-0 bg-transparent focus-visible:outline-offset-0`}
        />
        <Button disabled={!aiEnabled || busy || !question.trim()} aria-label="Send question">
          <SendHorizontal className="size-4" aria-hidden />
          <span className="hidden sm:inline">{busy ? "Thinking…" : "Ask"}</span>
        </Button>
      </form>
    </div>
  );
}
