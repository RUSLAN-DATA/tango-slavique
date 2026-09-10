"use client";

import { FormEvent, useState } from "react";
import { fieldClass, goldButtonClass, labelClass } from "@/components/ui/formStyles";

export function AccountSettingsForms({ applyTrack }: { applyTrack: string | null }) {
  const [payMessage, setPayMessage] = useState("");

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  async function checkout(type: "ENROLMENT" | "MONTHLY") {
    const response = await fetch("/api/payments/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    });
    const data = (await response.json()) as { url?: string | null; configured?: boolean };
    if (data.url) {
      window.location.href = data.url;
      return;
    }
    setPayMessage(
      data.configured === false
        ? "Payments will be available once Stripe is configured."
        : "Unable to start payment."
    );
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await fetch("/api/account/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: form.get("currentPassword"),
        newPassword: form.get("newPassword"),
      }),
    });
  }

  return (
    <div className="space-y-12">
      <form onSubmit={changePassword} className="max-w-md space-y-4">
        <p className="text-[11px] uppercase tracking-[0.16em] text-gold">Change password</p>
        <label className="block">
          <span className={labelClass}>Current password</span>
          <input required type="password" name="currentPassword" className={fieldClass} />
        </label>
        <label className="block">
          <span className={labelClass}>New password</span>
          <input required minLength={8} type="password" name="newPassword" className={fieldClass} />
        </label>
        <button type="submit" className={goldButtonClass}>
          Update password
        </button>
      </form>

      {applyTrack === "MAN" ? (
        <div className="max-w-md space-y-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-gold">Membership fees</p>
          <button type="button" onClick={() => void checkout("ENROLMENT")} className={goldButtonClass}>
            Enrolment €1,000
          </button>
          <button
            type="button"
            onClick={() => void checkout("MONTHLY")}
            className="w-full border border-amber-400/40 py-3 text-[11px] uppercase tracking-[0.18em] text-amber-200"
          >
            Monthly €400
          </button>
          {payMessage ? <p className="text-sm text-ivory/60">{payMessage}</p> : null}
        </div>
      ) : null}

      <button type="button" onClick={() => void logout()} className="text-[11px] uppercase tracking-[0.16em] text-ivory/40">
        Sign out
      </button>
    </div>
  );
}
