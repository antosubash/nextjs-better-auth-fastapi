import { CHAT_LABELS } from "@/lib/constants";

export function ExamplePrompts({ setInput }: { setInput: (value: string) => void }) {
  return (
    <div className="grid gap-3">
      <button
        type="button"
        onClick={() => setInput("Write a Fibonacci function in Python that uses memoization")}
        className="p-4 text-left rounded-lg border border-border/50 bg-card hover:bg-accent/50 transition-colors group"
      >
        <div className="font-medium text-sm mb-1">⚡ Code generation</div>
        <div className="text-xs text-muted-foreground">{CHAT_LABELS.EXAMPLE_PROMPT_1}</div>
      </button>
      <button
        type="button"
        onClick={() =>
          setInput(
            "Help me debug this JavaScript error: TypeError: Cannot read property 'map' of undefined"
          )
        }
        className="p-4 text-left rounded-lg border border-border/50 bg-card hover:bg-accent/50 transition-colors group"
      >
        <div className="font-medium text-sm mb-1">🔧 Debug code</div>
        <div className="text-xs text-muted-foreground">{CHAT_LABELS.EXAMPLE_PROMPT_2}</div>
      </button>
      <button
        type="button"
        onClick={() => setInput("Summarize the key points from this article about AI ethics")}
        className="p-4 text-left rounded-lg border border-border/50 bg-card hover:bg-accent/50 transition-colors group"
      >
        <div className="font-medium text-sm mb-1">📝 Content analysis</div>
        <div className="text-xs text-muted-foreground">{CHAT_LABELS.EXAMPLE_PROMPT_3}</div>
      </button>
    </div>
  );
}
