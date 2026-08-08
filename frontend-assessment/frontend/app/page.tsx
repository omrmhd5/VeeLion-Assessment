import Link from "next/link";

const MODULES = [
  {
    href: "/tasks",
    title: "Task Dashboard",
    description: "Browse tasks, filter by status, and toggle completion.",
    accentClass: "module-card--tasks",
  },
  {
    href: "/activity",
    title: "Activity Feed",
    description: "Search the activity log and see updates in real time.",
    accentClass: "module-card--activity",
  },
  {
    href: "/reports",
    title: "Reports",
    description:
      "View task totals, status breakdown, and recent activity counts.",
    accentClass: "module-card--reports",
  },
] as const;

export default function HomePage() {
  return (
    <>
      <header className="home-hero">
        <h1 className="home-hero__title">VeeLion Frontend Assessment</h1>
        <p className="home-hero__lead">
          Task, activity, and reports modules built against the provided
          backend.
        </p>
      </header>

      <section className="module-grid" aria-label="Modules">
        {MODULES.map((module) => (
          <Link
            key={module.href}
            href={module.href}
            className={`card card--padded card--interactive module-card ${module.accentClass}`}>
            <h2 className="module-card__title">{module.title}</h2>
            <p className="module-card__desc">{module.description}</p>
            <span className="module-card__arrow">Open module</span>
          </Link>
        ))}
      </section>
    </>
  );
}
