import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const metadata = { robots: { index: false, follow: false } };

export default async function AdminFeedbackPage() {
  try {
    await requireStaff();
  } catch {
    redirect("/login");
  }

  const feedback = await prisma.feedback.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { include: { profile: true } },
      introduction: true,
    },
  });

  return (
    <AdminShell title="Feedback">
      <ul className="space-y-4">
        {feedback.map((item) => (
          <li key={item.id} className="border border-white/[0.06] px-5 py-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-gold">{item.interest}</p>
            <p className="mt-2 text-ivory">{item.user.profile?.firstName}</p>
            <p className="mt-2 text-sm font-light text-ivory-muted">{item.comment}</p>
          </li>
        ))}
      </ul>
    </AdminShell>
  );
}
