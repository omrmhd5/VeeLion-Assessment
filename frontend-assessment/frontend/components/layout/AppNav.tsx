"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/tasks", label: "Tasks" },
  { href: "/activity", label: "Activity" },
  { href: "/reports", label: "Reports" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname.startsWith(href);
}

export function AppNav() {
  const pathname = usePathname();

  return (
    <header className="app-nav">
      <div className="app-nav__inner">
        <Link href="/" className="app-nav__brand">
          VeeLion
        </Link>
        <div className="app-nav__actions">
          <nav className="app-nav__links" aria-label="Main">
            {LINKS.map((link) => {
              const active = isActive(pathname, link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={
                    active
                      ? "app-nav__link app-nav__link--active"
                      : "app-nav__link"
                  }
                  aria-current={active ? "page" : undefined}>
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
