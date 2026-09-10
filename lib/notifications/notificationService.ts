import { NotificationStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { sendEmail, type EmailEvent } from "@/lib/email/send";

export async function notifyUser(input: {
  userId: string;
  title: string;
  body: string;
  href?: string;
  emailEvent?: EmailEvent;
  emailData?: Record<string, string>;
}) {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    include: { application: true },
  });

  if (!user) {
    return;
  }

  await prisma.notification.create({
    data: {
      userId: user.id,
      title: input.title,
      body: input.body,
      href: input.href,
    },
  });

  if (input.emailEvent) {
    await sendEmail({
      to: user.email,
      event: input.emailEvent,
      locale: user.application?.language === "es" ? "es" : "en",
      data: input.emailData,
    });
  }
}

export async function unreadCount(userId: string) {
  return prisma.notification.count({
    where: { userId, status: NotificationStatus.UNREAD },
  });
}

export async function markRead(userId: string, notificationId?: string) {
  await prisma.notification.updateMany({
    where: notificationId
      ? { id: notificationId, userId }
      : { userId, status: NotificationStatus.UNREAD },
    data: { status: NotificationStatus.READ },
  });
}
