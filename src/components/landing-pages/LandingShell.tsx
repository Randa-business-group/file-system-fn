import { LandingFooter } from "./LandingFooter";
import { LandingNavbar } from "./LandingNavbar";

export function LandingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <LandingNavbar />
      <main>{children}</main>
      <LandingFooter />
    </div>
  );
}
