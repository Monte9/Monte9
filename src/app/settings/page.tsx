import type { Metadata } from "next";
import SettingsPanel from "@/components/theme/SettingsPanel";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return <SettingsPanel />;
}
