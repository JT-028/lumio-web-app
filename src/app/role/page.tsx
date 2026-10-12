import type { Metadata } from "next";
import { RoleScreen } from "@/components/role-screen";

export const metadata: Metadata = {
  title: "Choose your role \u2014 Lumio",
};

export default function Page() {
  return <RoleScreen />;
}
