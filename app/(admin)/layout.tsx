import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ZenFix Admin Portal",
  description: "Enterprise Admin Portal for ZenFix",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
