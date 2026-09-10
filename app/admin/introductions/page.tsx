import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { IntroductionAdminForm } from "@/components/admin/IntroductionAdminForm";
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const metadata = { robots: { index: false, follow: false } };

export default async function AdminIntroductionsPage() {
  try {
    await requireStaff();
  } catch {
    redirect("/login");
  }

  const introductions = await prisma.introduction.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      userA: { include: { profile: true } },
      userB: { include: { profile: true } },
    },
  });

  return (
    <AdminShell title="Introductions">
      <ul className="space-y-8">
        {introductions.map((item) => (
          <li key={item.id} className="border border-white/[0.06] px-5 py-5">
            <p className="text-[11px] uppercase tracking-[0.16em] text-gold">{item.status}</p>
            <p className="mt-2 text-ivory">
              {item.userA.profile?.firstName} · {item.userB.profile?.firstName}
            </p>
            <IntroductionAdminForm introductionId={item.id} />
          </li>
        ))}
      </ul>
    </AdminShell>
  );
}
