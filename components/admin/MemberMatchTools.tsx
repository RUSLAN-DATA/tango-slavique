"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fieldClass, goldButtonClass } from "@/components/ui/formStyles";

type Candidate = {
  userId: string;
  firstName: string;
  city: string;
  compatibilityScore: number;
  positiveFactors: string[];
  potentialConflicts: string[];
};

export function MemberMatchTools({ memberId }: { memberId: string }) {
  const router = useRouter();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [note, setNote] = useState("");

  useEffect(() => {
    fetch(`/api/admin/members/${memberId}/candidates`)
      .then((response) => response.json())
      .then((data) => setCandidates(data.candidates || []))
      .catch(() => undefined);
  }, [memberId]);

  async function propose(userBId: string) {
    await fetch("/api/admin/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userAId: memberId, userBId }),
    });
    router.push("/admin/matches");
  }

  async function saveNote(event: FormEvent) {
    event.preventDefault();
    await fetch(`/api/admin/members/${memberId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: note }),
    });
    setNote("");
    router.refresh();
  }

  return (
    <div className="mt-10 space-y-8">
      <form onSubmit={saveNote} className="space-y-3">
        <textarea value={note} onChange={(event) => setNote(event.target.value)} className={fieldClass} rows={3} />
        <button type="submit" className={goldButtonClass}>
          Add internal note
        </button>
      </form>
      <div>
        <p className="text-[11px] uppercase tracking-[0.16em] text-gold">Suggested candidates</p>
        <ul className="mt-4 space-y-3">
          {candidates.map((candidate) => (
            <li key={candidate.userId} className="border border-white/[0.06] px-4 py-3">
              <p className="text-ivory">
                {candidate.firstName} · {candidate.city} · {candidate.compatibilityScore}
              </p>
              <p className="mt-1 text-xs text-ivory/50">
                {candidate.positiveFactors.join(" · ")}
              </p>
              {candidate.potentialConflicts.length ? (
                <p className="mt-1 text-xs text-rose-300/80">
                  {candidate.potentialConflicts.join(" · ")}
                </p>
              ) : null}
              <button
                type="button"
                onClick={() => void propose(candidate.userId)}
                className="mt-3 text-[11px] uppercase tracking-[0.16em] text-gold"
              >
                Propose match
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
