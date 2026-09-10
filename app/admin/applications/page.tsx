import { redirect } from "next/navigation";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const metadata = { robots: { index: false, follow: false } };

export default async function AdminApplicationsPage() {
  try {
    await requireStaff();
  } catch {
    redirect("/login");
  }

  const applications = await prisma.application.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { include: { profile: true } } },
  });

  return (
    <AdminShell title="Applications">
      <ul className="space-y-3">
        {applications.map((item) => (
          <li key={item.id} className="border border-white/[0.06] px-5 py-4">
            <Link href={`/admin/applications/${item.id}`} className="block">
              <p className="text-[11px] uppercase tracking-[0.16em] text-gold">
                {item.publicCode} · {item.status}
              </p>
              <p className="mt-2 text-ivory">
                {item.firstName} {item.lastName} · {item.track} · {item.city}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </AdminShell>
  );
}
