import { AppShellClient } from "@/components/dashboard/app-shell-client";

type NavigationItem = {
  href: string;
  label: string;
};

const navigationItems: NavigationItem[] = [
  {
    href: "/intakes",
    label: "Активни",
  },
  {
    href: "/archive",
    label: "Архив",
  },
  {
    href: "/sales",
    label: "Продажби",
  },
  // { href: "/print", label: "За печат" }, // hidden until print agent is live
];

export async function AppShell({
  activePath,
  userEmail,
  children,
}: {
  activePath: string;
  userEmail: string | null | undefined;
  children: React.ReactNode;
}) {
  return (
    <AppShellClient
      activePath={activePath}
      userEmail={userEmail}
      navigationItems={navigationItems}
      printAttentionCount={0}
    >
      {children}
    </AppShellClient>
  );
}
