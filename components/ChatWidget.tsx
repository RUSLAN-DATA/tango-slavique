"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Send, Sparkles, X } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { HashLink } from "@/components/ui/HashLink";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function ChatWidget() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "welcome", role: "assistant", content: t.chat.welcome },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const hasUserMessage = messages.some((message) => message.role === "user");

  useEffect(() => {
    setMessages((current) => {
      if (current.some((message) => message.role === "user")) {
        return current;
      }

      return [{ id: "welcome", role: "assistant", content: t.chat.welcome }];
    });
  }, [t.chat.welcome]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending, open]);

  async function sendMessage(text: string) {
    const content = text.trim();
    if (!content || pending) {
      return;
    }

    const userMessage: ChatMessage = {
      id: createId(),
      role: "user",
      content,
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setPending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          history: nextMessages
            .slice(0, -1)
            .map((item) => ({
              role: item.role,
              content: item.content,
            })),
        }),
      });

      const data = (await response.json()) as { reply?: string };

      setMessages((current) => [
        ...current,
        {
          id: createId(),
          role: "assistant",
          content: data.reply ?? t.chat.unavailable,
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: createId(),
          role: "assistant",
          content: t.chat.disconnected,
        },
      ]);
    } finally {
      setPending(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  return (
    <div className="pointer-events-none fixed bottom-5 right-4 z-[70] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      <AnimatePresence>
        {open ? (
          <motion.section
            key="panel"
            role="dialog"
            aria-label={t.chat.dialog}
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto flex h-[min(520px,70vh)] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden border border-amber-400/30 bg-[#070709]/80 backdrop-blur-md"
          >
            <header className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center border border-amber-400/20 text-gold">
                  <Sparkles size={15} strokeWidth={1.5} />
                </span>
                <div>
                  <p className="font-display text-lg leading-tight text-ivory">
                    {t.chat.name}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-gold/80">
                    Tango Slavique
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t.chat.close}
                className="flex h-8 w-8 items-center justify-center text-ivory/70 transition-colors hover:text-gold"
              >
                <X size={16} />
              </button>
            </header>

            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <p
                    className={`max-w-[85%] overflow-visible px-3.5 py-2.5 text-sm font-light leading-relaxed whitespace-pre-wrap break-words ${
                      message.role === "user"
                        ? "bg-gold/15 text-ivory"
                        : "glass-panel text-ivory-muted"
                    }`}
                  >
                    {message.content}
                  </p>
                </motion.div>
              ))}

              {pending ? (
                <div className="flex justify-start">
                  <div className="glass-panel flex items-center gap-1.5 px-3.5 py-3">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gold [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gold [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gold" />
                  </div>
                </div>
              ) : null}

              {!hasUserMessage ? (
                <div className="flex flex-col gap-2 pt-1">
                  {t.chat.prompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => void sendMessage(prompt)}
                      className="border border-amber-400/10 bg-gold/[0.04] px-3 py-2 text-left text-xs font-light leading-relaxed text-ivory/80 transition-colors duration-300 hover:border-amber-400/30 hover:text-ivory"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              ) : null}

              <div ref={messagesEndRef} />
            </div>

            <div className="px-4 py-3">
              <form onSubmit={handleSubmit} className="flex items-end gap-2">
                <label className="sr-only" htmlFor="concierge-input">
                  {t.chat.input}
                </label>
                <textarea
                  id="concierge-input"
                  rows={1}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void sendMessage(input);
                    }
                  }}
                  placeholder={t.chat.placeholder}
                  className="max-h-24 min-h-[44px] flex-1 resize-none border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-base text-ivory outline-none placeholder:text-ivory/30 focus:border-gold"
                />
                <button
                  type="submit"
                  disabled={pending || !input.trim()}
                  aria-label={t.chat.send}
                  className="flex h-[44px] w-[44px] shrink-0 items-center justify-center bg-gold text-obsidian transition-opacity disabled:opacity-40"
                >
                  <Send size={15} />
                </button>
              </form>
              <HashLink
                href="/#contact"
                onNavigate={() => setOpen(false)}
                className="mt-3 block text-center text-[10px] uppercase tracking-[0.16em] text-gold/80 transition-colors hover:text-gold"
              >
                {t.chat.apply}
              </HashLink>
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>

      <motion.button
        type="button"
        aria-expanded={open}
        aria-label={open ? t.chat.closeFab : t.chat.open}
        onClick={() => setOpen((current) => !current)}
        className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full border border-amber-400/30 bg-[#070709]/80 text-gold backdrop-blur-md"
        whileHover={{
          scale: 1.05,
          boxShadow:
            "0 0 0 1px rgba(201, 165, 92, 0.55), 0 12px 32px rgba(201, 165, 92, 0.28)",
        }}
        whileTap={{ scale: 0.96 }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={open ? "close" : "open"}
            initial={{ opacity: 0, rotate: -70, scale: 0.8 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 70, scale: 0.8 }}
            transition={{ duration: 0.22 }}
            className="inline-flex"
          >
            {open ? <X size={20} /> : <Sparkles size={20} strokeWidth={1.5} />}
          </motion.span>
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
