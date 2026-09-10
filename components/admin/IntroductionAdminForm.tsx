"use client";

import { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { fieldClass, goldButtonClass, labelClass } from "@/components/ui/formStyles";

export function IntroductionAdminForm({ introductionId }: { introductionId: string }) {
  const router = useRouter();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await fetch(`/api/admin/introductions/${introductionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "schedule",
        scheduledAt: form.get("scheduledAt"),
        location: form.get("location"),
        format: form.get("format"),
        instructions: form.get("instructions"),
        privateNotes: form.get("privateNotes"),
      }),
    });
    router.refresh();
  }

  async function setStatus(status: string) {
    await fetch(`/api/admin/introductions/${introductionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  return (
    <div className="mt-8 space-y-6">
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <span className={labelClass}>Date and time</span>
          <input required type="datetime-local" name="scheduledAt" className={fieldClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Location</span>
          <input name="location" className={fieldClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Format</span>
          <input name="format" defaultValue="in-person" className={fieldClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Instructions</span>
          <textarea name="instructions" rows={3} className={fieldClass} />
        </label>
        <label className="block">
          <span className={labelClass}>Private notes</span>
          <textarea name="privateNotes" rows={3} className={fieldClass} />
        </label>
        <button type="submit" className={goldButtonClass}>
          Schedule introduction
        </button>
      </form>
      <div className="flex gap-3">
        <button type="button" onClick={() => void setStatus("COMPLETED")} className="text-[11px] uppercase tracking-[0.16em] text-gold">
          Mark completed
        </button>
        <button type="button" onClick={() => void setStatus("CANCELLED")} className="text-[11px] uppercase tracking-[0.16em] text-ivory/40">
          Cancel
        </button>
      </div>
    </div>
  );
}
