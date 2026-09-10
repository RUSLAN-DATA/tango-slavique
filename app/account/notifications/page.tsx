import { redirect } from "next/navigation";
import { AccountShell } from "@/components/account/AccountShell";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { markRead } from "@/lib/notifications/notificationService";

export const metadata = { robots: { index: false, follow: false } };

export default async function AccountNotificationsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  await markRead(user.id);

  return (
    <AccountShell title="Notifications">
      {notifications.length === 0 ? (
        <p className="text-sm font-light text-ivory-muted">No notices at present.</p>
      ) : (
        <ul className="space-y-4">
          {notifications.map((item) => (
            <li key={item.id} className="border border-white/[0.06] px-5 py-4">
              <p className="text-ivory">{item.title}</p>
              <p className="mt-2 text-sm font-light text-ivory-muted">{item.body}</p>
            </li>
          ))}
        </ul>
      )}
    </AccountShell>
  );
}
