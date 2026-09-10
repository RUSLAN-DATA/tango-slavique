"use client";

import { FormEvent, useState } from "react";
import { goldButtonClass, fieldClass, labelClass } from "@/components/ui/formStyles";

export function FeedbackForm({ introductionId }: { introductionId: string }) {
  const [sent, setSent] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await fetch(`/api/account/introductions/${introductionId}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        interest: form.get("interest"),
        comment: form.get("comment"),
      }),
    });
    setSent(true);
  }

  if (sent) {
    return <p className="mt-6 text-sm text-gold">Feedback received. The other person cannot see it.</p>;
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      <label className="block">
        <span className={labelClass}>Private feedback</span>
        <select name="interest" required className={fieldClass}>
          <option value="ANOTHER_MEETING">I would like another meeting</option>
          <option value="INTERESTED">I am interested</option>
          <option value="UNSURE">I am unsure</option>
          <option value="NOT_INTERESTED">I am not interested</option>
        </select>
      </label>
      <label className="block">
        <span className={labelClass}>Private comment</span>
        <textarea name="comment" rows={4} className={fieldClass} />
      </label>
      <button type="submit" className={goldButtonClass}>
        Send feedback
      </button>
    </form>
  );
}
