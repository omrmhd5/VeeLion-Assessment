import Link from "next/link";
import { ReportsDashboard } from "@/components/reports/ReportsDashboard";

export default function ReportsPage() {
  return (
    <main className="stack">
      <nav>
        <Link href="/" className="button">
          Back
        </Link>
      </nav>
      <ReportsDashboard />
    </main>
  );
}
