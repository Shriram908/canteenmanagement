import { Link } from "@tanstack/react-router";
import { ChefHat, Settings2, ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { AppShell } from "./AppShell";
import { Button } from "./ui/button";

export function StaffShell({ children, admin }: { children: ReactNode; admin?: boolean }) {
  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-center gap-3 border-b pb-4">
        <ChefHat className="h-6 w-6 text-primary" />
        <span className="font-display text-xl font-semibold">Food Book · Staff</span>
        <nav className="flex flex-wrap gap-2 md:ml-auto">
          <Button asChild variant="outline">
            <Link to="/kitchen">
              <ChefHat />
              Kitchen
            </Link>
          </Button>
          {admin && (
            <Button asChild variant="outline">
              <Link to="/admin">
                <Settings2 />
                Administration
              </Link>
            </Button>
          )}
          <Button asChild variant="ghost">
            <Link to="/profile">
              <ArrowLeft />
              Account
            </Link>
          </Button>
        </nav>
      </div>
      {children}
    </AppShell>
  );
}

export function AccessDenied() {
  return (
    <AppShell>
      <h1 className="text-2xl font-bold">Staff access required</h1>
      <p className="mt-3 text-muted-foreground">
        Your account has not been assigned access to this area.
      </p>
      <Button asChild className="mt-5">
        <Link to="/profile">Back to account</Link>
      </Button>
    </AppShell>
  );
}
