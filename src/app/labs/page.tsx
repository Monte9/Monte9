import type { Metadata } from "next";
import Redirect from "@/components/ui/Redirect";

// Legacy route: /labs was renamed to /apps. Forward old links.
export const metadata: Metadata = { title: "Apps" };

export default function LabsRedirect() {
  return <Redirect to="/apps/" />;
}
