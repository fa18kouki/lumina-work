import { OwnerLayoutWrapper } from "@/components/layout/owner-layout-wrapper";

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <OwnerLayoutWrapper>{children}</OwnerLayoutWrapper>;
}
