import { redirect } from "next/navigation";
import { AccountShell } from "@/components/account/AccountShell";
import { AccountSettingsForms } from "@/components/account/AccountSettingsForms";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata = { robots: { index: false, follow: false } };

export default async function AccountSettingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <AccountShell title="Settings">
      <AccountSettingsForms applyTrack={user.applyTrack} />
    </AccountShell>
  );
}
