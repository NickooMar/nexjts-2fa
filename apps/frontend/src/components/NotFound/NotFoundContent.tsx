import Link from "next/link";
import { ArrowLeft, Compass, Home, MapPinned } from "lucide-react";
import { DM_Sans, DM_Serif_Display } from "next/font/google";
import { ThemeSwitcher } from "@/components/Theme/ThemeSwitcher";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const displayFont = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

const bodyFont = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
});

export function NotFoundContent() {
  return (
    <main
      className={`${displayFont.variable} ${bodyFont.variable} relative min-h-screen overflow-hidden bg-background text-foreground`}
      style={{ fontFamily: "var(--font-body, ui-sans-serif)" }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "linear-gradient(to right, hsl(var(--foreground) / 0.06) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--foreground) / 0.06) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.16),transparent_58%)]" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[32rem] bg-[radial-gradient(circle_at_center,hsl(var(--accent)/0.12),transparent_62%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,hsl(var(--background)/0.1),hsl(var(--background)/0.82)_38%,hsl(var(--background))_100%)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-6 sm:px-8">
        <div className="flex justify-end">
          <div className="rounded-full border border-border/70 bg-background/80 p-1 shadow-sm backdrop-blur">
            <ThemeSwitcher />
          </div>
        </div>

        <div className="flex flex-1 items-center">
          <div className="grid w-full items-center gap-8 py-10 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="max-w-3xl">
              <Badge
                variant="outline"
                className="mb-5 rounded-full border-border/70 bg-background/80 px-4 py-1 text-[11px] uppercase tracking-[0.28em] text-muted-foreground backdrop-blur"
              >
                Page missing
              </Badge>

              <p
                className="text-[5.5rem] leading-none tracking-[-0.08em] text-foreground/90 sm:text-[7.5rem] lg:text-[9rem]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                404
              </p>

              <h1
                className="mt-4 max-w-2xl text-4xl leading-tight tracking-tight sm:text-5xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                This address is no longer on the map.
              </h1>

              <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                The page you were trying to reach may have been moved, renamed,
                or never published. Let&apos;s get you back to a valid property in
                the portfolio.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button asChild size="lg" className="gap-2 px-6 shadow-sm">
                  <Link href="/">
                    <Home className="size-4" />
                    Back to home
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="gap-2 px-6">
                  <Link href="/home">
                    <Compass className="size-4" />
                    Open the app
                  </Link>
                </Button>
              </div>

              <div className="mt-10 flex items-center gap-3 text-sm text-muted-foreground">
                <ArrowLeft className="size-4" />
                Double-check the URL or use the navigation to continue.
              </div>
            </section>

            <Card className="relative overflow-hidden border-border/70 bg-card/85 shadow-2xl backdrop-blur">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
              <CardHeader className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex size-14 items-center justify-center rounded-2xl border border-border/70 bg-primary/10">
                    <MapPinned className="size-7 text-primary" />
                  </div>
                  <Badge className="rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.22em]">
                    HomiQ
                  </Badge>
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-2xl">Next best move</CardTitle>
                  <CardDescription className="text-sm leading-6">
                    The quickest way back is to start from a known destination.
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {[
                  {
                    title: "Return to the landing page",
                    description: "Restart your navigation from the public home screen.",
                  },
                  {
                    title: "Open your workspace",
                    description: "Jump back into the authenticated app experience.",
                  },
                  {
                    title: "Try a different route",
                    description: "The resource may exist under another path or locale.",
                  },
                ].map((item, index) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-border/70 bg-background/70 p-4 shadow-sm"
                  >
                    <div className="mb-2 flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground">
                        {index + 1}
                      </div>
                      <p className="font-medium">{item.title}</p>
                    </div>
                    <p className="pl-11 text-sm leading-6 text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                ))}

                <div className="rounded-2xl border border-dashed border-border/80 bg-muted/40 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                    Status
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    The server responded correctly, but the requested route could
                    not be resolved.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
