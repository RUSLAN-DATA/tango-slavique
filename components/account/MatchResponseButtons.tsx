"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { goldButtonClass } from "@/components/ui/formStyles";

export function MatchResponseButtons({
  matchId,
  current,
}: {
  matchId: string;
  current: string;
}) {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  if (current !== "PENDING") {
    return null;
  }

  async function respond(value: "ACCEPTED" | "DECLINED") {
    setSending(true);
    await fetch(`/api/account/matches/${matchId}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    });
    setSending(false);
    router.refresh();
  }

  return (
    <div className="mt-8 flex flex-wrap gap-3">
      <button disabled={sending} onClick={() => void respond("ACCEPTED")} className={goldButtonClass}>
        Accept
      </button>
      <button
        disabled={sending}
        onClick={() => void respond("DECLINED")}
        className="border border-white/20 px-6 py-3 text-[11px] uppercase tracking-[0.18em] text-ivory/70"
      >
        Decline
      </button>
    </div>
  );
}
