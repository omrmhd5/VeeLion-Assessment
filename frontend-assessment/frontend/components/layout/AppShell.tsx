import { AppNav } from "@/components/layout/AppNav";
import { ThemeProvider } from "@/components/layout/ThemeProvider";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <ThemeProvider>
      <AppNav />
      <main className="app-main">{children}</main>
    </ThemeProvider>
  );
}
