import { AppNav } from "@/components/layout/AppNav";
import { ThemeProvider } from "@/components/layout/ThemeProvider";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <ThemeProvider>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <AppNav />
      <main id="main-content" className="app-main" tabIndex={-1}>
        {children}
      </main>
    </ThemeProvider>
  );
}
