import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireStaff } from "@/lib/auth/session";
import { canManagePayments } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";

export const metadata = { robots: { index: false, follow: false } };

export default async function AdminPaymentsPage() {
  let staff;
  try {
    staff = await requireStaff();
  } catch {
    redirect("/login");
  }

  if (!canManagePayments(staff.role)) {
    redirect("/admin");
  }

  const payments = await prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { include: { profile: true } } },
  });

  return (
    <AdminShell title="Payments">
      <ul className="space-y-3">
        {payments.map((payment) => (
          <li key={payment.id} className="border border-white/[0.06] px-5 py-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-gold">
              {payment.type} · {payment.status}
            </p>
            <p className="mt-2 text-ivory">
              {payment.user.profile?.firstName} · €{(payment.amountCents / 100).toFixed(0)}
            </p>
          </li>
        ))}
      </ul>
    </AdminShell>
  );
}
