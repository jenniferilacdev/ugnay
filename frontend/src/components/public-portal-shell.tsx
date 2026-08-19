import Link from "next/link";
import type { ReactNode } from "react";
import { LandmarkIcon } from "lucide-react";

/** Standalone chrome for the public barangay/LGU portals (no app sidebar). */
export function PublicPortalShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <LandmarkIcon className="size-4" />
            </span>
            UGNAY
          </Link>
          <Link
            href="/login"
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Staff sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">{children}</main>

      <footer className="border-t bg-background">
        <div className="mx-auto w-full max-w-4xl px-6 py-6 text-xs text-muted-foreground">
          UGNAY — public information portal. Public information only.
        </div>
      </footer>
    </div>
  );
}
