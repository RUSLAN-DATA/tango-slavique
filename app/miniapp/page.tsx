import { MiniAppShell } from "@/components/miniapp/MiniAppShell";

export const metadata = {
  title: "Tango Slavique Mini App",
  robots: { index: false, follow: false },
};

export default function MiniAppPage() {
  return <MiniAppShell />;
}
