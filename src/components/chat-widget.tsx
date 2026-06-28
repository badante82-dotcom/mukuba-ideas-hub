import { useState, useRef, useEffect } from "react";
import { Bot, X, Send } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { chatWithBot } from "@/lib/chatbot.functions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

const GREETINGS: string[] = [
  "Hi there 👋 I'm MukubaBot. What's on your mind today — submitting something, tracking a reply, or just curious how this works?",
  "Hey! MukubaBot here. Tell me what you're trying to do and I'll point you to the right spot.",
  "Welcome 🤖 Need help with the Suggestion Box? Ask me anything — submissions, statuses, anonymity, anything goes.",
  "Hi! I'm the support bot for the Smart Mukuba Suggestion Box. What can I help you figure out?",
];

const THINKING_PHRASES = [
  "Thinking…",
  "Looking that up…",
  "Working on it…",
  "One sec…",
  "Pulling that together…",
];

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>(() => [
    { role: "assistant", content: GREETINGS[Math.floor(Math.random() * GREETINGS.length)] },
  ]);
  const [loading, setLoading] = useState(false);
  const [thinkingText, setThinkingText] = useState(THINKING_PHRASES[0]);
  const chat = useServerFn(chatWithBot);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open, loading]);

  // Cycle the "thinking" phrase while waiting so it feels alive.
  useEffect(() => {
    if (!loading) return;
    setThinkingText(THINKING_PHRASES[Math.floor(Math.random() * THINKING_PHRASES.length)]);
    const id = setInterval(() => {
      setThinkingText(THINKING_PHRASES[Math.floor(Math.random() * THINKING_PHRASES.length)]);
    }, 1800);
    return () => clearInterval(id);
  }, [loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const { reply } = await chat({ data: { messages: next.map((m) => ({ role: m.role, content: m.content })) } });
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      toast.error(msg);
      setMessages((m) => [...m, { role: "assistant", content: "Hmm, I couldn't reach my brain just now — mind trying that again in a moment?" }]);
    } finally {
      setLoading(false);
    }
  };


  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open chat assistant"
          className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 h-14 w-14 rounded-full bg-emerald text-navy shadow-lg grid place-items-center hover:scale-105 transition-transform"
        >
          <Bot className="h-7 w-7" />
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-soft animate-pulse" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 w-[calc(100vw-2rem)] max-w-sm h-[32rem] max-h-[80vh] rounded-2xl border border-border bg-background shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-navy text-white">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-emerald/20 text-emerald grid place-items-center">
                <Bot className="h-4 w-4" />
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold">MukubaBot</div>
                <div className="text-[10px] text-white/60">AI assistant · online</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close chat" className="p-1 rounded hover:bg-white/10">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 bg-muted/30">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === "user" ? "bg-emerald text-navy" : "bg-card border border-border text-foreground"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl px-3 py-2 bg-card border border-border text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" /> Thinking…
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); void send(); }}
            className="flex items-center gap-2 p-2 border-t border-border bg-background"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about the platform…"
              disabled={loading}
              className="flex-1 h-9 px-3 rounded-md bg-muted text-sm focus:outline-none focus:ring-1 focus:ring-emerald"
            />
            <Button type="submit" size="icon" disabled={loading || !input.trim()} aria-label="Send">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
