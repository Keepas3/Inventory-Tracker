"use client";

import { useState } from "react";

const EXAMPLES = ["What needs attention this month?", "Do I have a spare HDMI cable?", "What's my total electronics value?", "What's in the home lab?"];

interface Turn {
  question: string;
  answer?: string;
  error?: string;
}

export function AskClient({ aiEnabled }: { aiEnabled: boolean }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);

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
      patch = { error: "Couldn't reach the server." };
    }
    setTurns((t) => t.map((turn, i) => (i === t.length - 1 ? { ...turn, ...patch } : turn)));
    setBusy(false);
  }

  return (
    <div className="space-y-6">
      {!aiEnabled && (
        <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-900 dark:bg-amber-950/30">
          AI isn&apos;t configured on this server. Add <code>ANTHROPIC_API_KEY</code> to <code>.env.local</code> and restart.
        </p>
      )}

      <div className="space-y-4" aria-live="polite">
        {turns.map((t, i) => (
          <div key={i} className="space-y-2">
            <p className="ml-auto w-fit max-w-[85%] rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white">{t.question}</p>
            <div className="max-w-[85%] whitespace-pre-wrap rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800">
              {t.answer ?? (t.error ? <span className="text-red-600">{t.error}</span> : <span className="text-zinc-500">Checking your inventory…</span>)}
            </div>
          </div>
        ))}
      </div>

      {turns.length === 0 && (
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((e) => (
            <button key={e} onClick={() => ask(e)} disabled={!aiEnabled || busy} className="rounded-full border border-zinc-300 px-3 py-1 text-xs hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-900">
              {e}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); ask(question); }} className="flex gap-2">
        <input value={question} onChange={(e) => setQuestion(e.target.value)} maxLength={500} placeholder="Ask about what you own…" aria-label="Question" disabled={!aiEnabled} className="flex-1 rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700" />
        <button disabled={!aiEnabled || busy || !question.trim()} className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
          {busy ? "…" : "Ask"}
        </button>
      </form>
    </div>
  );
}
