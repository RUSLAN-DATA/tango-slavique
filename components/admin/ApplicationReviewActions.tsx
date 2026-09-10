"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { fieldClass, goldButtonClass, labelClass } from "@/components/ui/formStyles";

export function ApplicationReviewActions({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [moreInfo, setMoreInfo] = useState("");

  async function send(status: string) {
    await fetch(`/api/admin/applications/${applicationId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        note,
        moreInfoRequest: moreInfo,
      }),
    });
    router.refresh();
  }

  async function addNote(event: FormEvent) {
    event.preventDefault();
    await send("");
  }

  return (
    <div className="mt-10 space-y-4 border-t border-white/[0.06] pt-8">
      <p className="text-[11px] uppercase tracking-[0.16em] text-gold">
        Internal notes — never shown to members
      </p>
      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        className={fieldClass}
        rows={4}
        placeholder="Internal note"
      />
      <textarea
        value={moreInfo}
        onChange={(event) => setMoreInfo(event.target.value)}
        className={fieldClass}
        rows={3}
        placeholder="Request more information"
      />
      <div className="flex flex-wrap gap-3">
        <button type="button" className={goldButtonClass} onClick={() => void send("UNDER_REVIEW")}>
          Under review
        </button>
        <button type="button" className={goldButtonClass} onClick={() => void send("APPROVED")}>
          Approve
        </button>
        <button
          type="button"
          className="border border-white/20 px-5 py-3 text-[11px] uppercase tracking-[0.16em] text-ivory/70"
          onClick={() => void send("REJECTED")}
        >
          Reject
        </button>
        <button
          type="button"
          className="border border-amber-400/40 px-5 py-3 text-[11px] uppercase tracking-[0.16em] text-amber-200"
          onClick={() => void send("NEEDS_MORE_INFO")}
        >
          Request more information
        </button>
      </div>
      <form onSubmit={addNote} className="hidden">
        <span className={labelClass}>Note</span>
      </form>
    </div>
  );
}
