"use client";

import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { DM_Serif_Display, DM_Sans } from "next/font/google";

const displayFont = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

const bodyFont = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
});

/* const partnerNames = [
  "Urban Nest Realty",
  "PrimeStreet Group",
  "HavenPoint",
  "Bricklane Partners",
  "NorthOak Living",
  "Keyline Property Co.",
  "Skyward Estates",
  "Beacon Rentals",
];
 */
const featureKeys = [
  {
    key: "rent_collection",
    tagColor: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
    gradient:
      "from-sky-50/60 to-blue-50/30 dark:from-sky-950/30 dark:to-blue-950/20",
    border: "border-sky-200/50 dark:border-sky-500/20",
  },
  {
    key: "maintenance",
    tagColor:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
    gradient:
      "from-emerald-50/60 to-teal-50/30 dark:from-emerald-950/30 dark:to-teal-950/20",
    border: "border-emerald-200/50 dark:border-emerald-500/20",
  },
  {
    key: "analytics",
    tagColor:
      "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
    gradient:
      "from-violet-50/60 to-purple-50/30 dark:from-violet-950/30 dark:to-purple-950/20",
    border: "border-violet-200/50 dark:border-violet-500/20",
  },
  {
    key: "portals",
    tagColor:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
    gradient:
      "from-amber-50/60 to-orange-50/30 dark:from-amber-950/30 dark:to-orange-950/20",
    border: "border-amber-200/50 dark:border-amber-500/20",
  },
];

export default function HomePage() {
  const t = useTranslations("landing");

  return (
    <main
      className={`${displayFont.variable} ${bodyFont.variable} overflow-x-hidden bg-background text-foreground`}
      style={{ fontFamily: "var(--font-body, ui-sans-serif)" }}
    >
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50%       { transform: translateY(-10px) rotate(0.3deg); }
        }
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes lineGrow {
          from { stroke-dashoffset: 900; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes pulseOpacity {
          0%, 100% { opacity: 0.7; }
          50%       { opacity: 1; }
        }

        .anim-fade-1 { animation: fadeUp 0.65s 0.05s ease both; }
        .anim-fade-2 { animation: fadeUp 0.65s 0.18s ease both; }
        .anim-fade-3 { animation: fadeUp 0.65s 0.32s ease both; }
        .anim-fade-4 { animation: fadeUp 0.65s 0.46s ease both; }
        .anim-fade-5 { animation: fadeUp 0.75s 0.62s ease both; }

        .anim-float { animation: float 7s ease-in-out infinite; }

        .anim-marquee { animation: marquee 30s linear infinite; }
        .anim-marquee:hover { animation-play-state: paused; }

        .chart-line-1 {
          stroke-dasharray: 900;
          stroke-dashoffset: 900;
          animation: lineGrow 1.8s 1.2s ease forwards;
        }
        .chart-line-2 {
          stroke-dasharray: 900;
          stroke-dashoffset: 900;
          animation: lineGrow 1.8s 1.5s ease forwards;
        }
        .stat-pulse { animation: pulseOpacity 2.5s ease-in-out infinite; }

        .feature-card {
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .feature-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px hsl(var(--foreground) / 0.09);
        }
      `}</style>

      {/* ═══ HERO ═══ */}
      <section className="relative flex min-h-[92vh] flex-col overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, hsl(var(--foreground) / 0.06) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--foreground) / 0.06) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 75% 55% at 50% 5%, hsl(var(--background) / 0.96) 0%, hsl(var(--background) / 0.55) 55%, transparent 100%)",
          }}
        />
        <div className="pointer-events-none absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-background via-background/60 to-transparent" />

        <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center px-6 pb-20 pt-28 md:pt-36">
          <div className="anim-fade-1 mb-7">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/90 px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
              </span>
              {t("hero.badge")}
            </span>
          </div>

          <h1
            className="anim-fade-2 max-w-6xl text-center text-5xl font-normal leading-[1.12] tracking-tight text-foreground md:text-7xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {t("hero.title_line1")}
            <br />
            {t("hero.title_line2")}{" "}
            <span className="text-muted-foreground">
              {t("hero.title_highlight1")}
            </span>
            <br />
            <span className="text-muted-foreground">
              {t("hero.title_highlight2")}
            </span>
          </h1>

          <p className="anim-fade-3 mt-6 max-w-xl text-center text-base leading-relaxed text-muted-foreground md:text-lg">
            {t("hero.description")}
          </p>

          <div className="anim-fade-4 mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" className="px-7 shadow-md">
              {t("hero.cta_primary")}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="px-7 bg-background/70 backdrop-blur-sm"
            >
              {t("hero.cta_secondary")}
            </Button>
          </div>

          {/* ─── Dashboard Mockup ─── */}
          <div className="anim-fade-5 anim-float mt-16 w-full max-w-5xl">
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
              <div className="flex items-center gap-3 border-b border-border bg-muted/70 px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                  <div className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                  <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                </div>
                <div className="ml-auto hidden max-w-[70%] items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1 text-xs text-muted-foreground shadow-sm sm:flex">
                  <svg
                    className="h-2.5 w-2.5 text-muted-foreground/60"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"
                    />
                  </svg>
                  <span className="truncate">app.homiq.com/dashboard</span>
                </div>
              </div>

              <div className="grid md:grid-cols-[196px_1fr]">
                <aside className="hidden border-r border-border bg-muted/40 p-4 md:block">
                  <div className="mb-5 flex items-center gap-2.5">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary">
                      <svg
                        className="h-3.5 w-3.5 text-primary-foreground"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                      </svg>
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      HomiQ
                    </span>
                  </div>

                  <div className="mb-4 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
                    {t("mockup.search")}
                  </div>

                  <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    {t("mockup.menu")}
                  </p>
                  <nav className="space-y-0.5">
                    {(
                      [
                        { key: "dashboard", active: true },
                        { key: "rent_roll", active: false },
                        { key: "maintenance", active: false },
                        { key: "lease_renewals", active: false },
                      ] as const
                    ).map((item) => (
                      <div
                        key={item.key}
                        className={`rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                          item.active
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {t(`mockup.${item.key}`)}
                      </div>
                    ))}
                  </nav>

                  <p className="mb-1.5 mt-4 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    {t("mockup.reports")}
                  </p>
                  <nav className="space-y-0.5">
                    {(["financials", "occupancy_label"] as const).map((key) => (
                      <div
                        key={key}
                        className="rounded-md px-3 py-2 text-xs font-medium text-muted-foreground"
                      >
                        {t(`mockup.${key}`)}
                      </div>
                    ))}
                  </nav>
                </aside>

                <div className="p-4 md:p-6">
                  <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{t("mockup.last_updated")}</span>
                        <span className="h-1 w-1 rounded-full bg-border" />
                        <span className="text-emerald-500">
                          {t("mockup.live")}
                        </span>
                      </div>
                      <p className="mt-1 text-2xl font-semibold text-foreground">
                        $1,248,900
                      </p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400">
                        {t("mockup.from_last_period")}
                      </p>
                    </div>
                    <div className="grid w-full grid-cols-3 gap-2 sm:w-auto sm:flex">
                      <div className="rounded-lg border border-border bg-muted px-2 py-2 text-center sm:px-3">
                        <p className="text-[10px] font-medium text-muted-foreground">
                          {t("mockup.units")}
                        </p>
                        <p className="text-sm font-semibold text-foreground">
                          128
                        </p>
                      </div>
                      <div className="rounded-lg border border-border bg-muted px-2 py-2 text-center sm:px-3">
                        <p className="text-[10px] font-medium text-muted-foreground">
                          {t("mockup.occupancy_label")}
                        </p>
                        <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                          94%
                        </p>
                      </div>
                      <div className="rounded-lg border border-border bg-muted px-2 py-2 text-center sm:px-3">
                        <p className="text-[10px] font-medium text-muted-foreground">
                          {t("mockup.overdue")}
                        </p>
                        <p className="text-sm font-semibold text-rose-500">3</p>
                      </div>
                    </div>
                  </div>

                  <div className="relative rounded-xl border border-border bg-muted/50 p-4">
                    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs font-medium text-foreground">
                        {t("mockup.revenue_title")}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground sm:gap-4">
                        <span className="flex items-center gap-1.5">
                          <span className="h-1.5 w-5 rounded-full bg-foreground/80" />
                          {t("mockup.this_period")}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="h-1.5 w-5 rounded-full bg-sky-400/60" />
                          {t("mockup.last_period")}
                        </span>
                      </div>
                    </div>

                    <div className="relative h-32">
                      <svg
                        viewBox="0 0 620 128"
                        className="absolute inset-0 h-full w-full"
                        preserveAspectRatio="none"
                      >
                        {[32, 64, 96].map((y) => (
                          <line
                            key={y}
                            x1="0"
                            y1={y}
                            x2="620"
                            y2={y}
                            stroke="hsl(var(--foreground) / 0.05)"
                            strokeWidth="1"
                          />
                        ))}

                        <path
                          d="M0 95 C55 75 120 105 185 78 C250 55 300 72 355 58 C415 43 480 96 620 52 L620 128 L0 128 Z"
                          fill="url(#heroAreaGrad)"
                          opacity="0.45"
                        />

                        <path
                          className="chart-line-1"
                          d="M0 95 C55 75 120 105 185 78 C250 55 300 72 355 58 C415 43 480 96 620 52"
                          fill="none"
                          stroke="hsl(var(--foreground) / 0.8)"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />

                        <path
                          className="chart-line-2"
                          d="M0 112 C70 102 145 116 215 108 C285 100 355 110 425 106 C495 101 555 114 620 104"
                          fill="none"
                          stroke="rgba(56,189,248,0.65)"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />

                        <circle
                          cx="355"
                          cy="58"
                          r="4"
                          fill="hsl(var(--background))"
                          stroke="hsl(var(--foreground) / 0.8)"
                          strokeWidth="2"
                          className="stat-pulse"
                        />

                        <defs>
                          <linearGradient
                            id="heroAreaGrad"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="hsl(var(--foreground) / 0.14)"
                            />
                            <stop
                              offset="100%"
                              stopColor="hsl(var(--foreground) / 0)"
                            />
                          </linearGradient>
                        </defs>
                      </svg>

                      <div className="absolute left-[55%] top-0 hidden -translate-x-1/2 -translate-y-1 rounded-md border border-border bg-card px-2 py-1 text-[10px] shadow-sm sm:block">
                        <p className="font-semibold text-foreground">
                          $218,400
                        </p>
                        <p className="text-muted-foreground">Feb 20, 2026</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ TRUSTED BY ═══ */}
      {/* <section className="border-y border-border py-12">
        <p className="mb-8 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("trusted.title")}
        </p>
        <div className="relative overflow-hidden">
          <div
            className="anim-marquee flex gap-16"
            style={{ width: "max-content" }}
          >
            {[...partnerNames, ...partnerNames].map((name, i) => (
              <span
                key={i}
                className="shrink-0 text-sm font-medium tracking-wide text-muted-foreground transition-colors hover:text-foreground"
              >
                {name}
              </span>
            ))}
          </div>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent" />
        </div>
      </section> */}

      {/* ═══ FEATURES ═══ */}
      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-4xl space-y-4 text-center">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">
              {t("features.label")}
            </span>
            <h2
              className="text-4xl font-normal leading-[1.14] tracking-tight md:text-5xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {t("features.title_line1")}
              <br />
              {t("features.title_line2")}
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
              {t("features.description")}
            </p>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-2">
            {featureKeys.map((feature) => (
              <article
                key={feature.key}
                className={`feature-card relative overflow-hidden rounded-2xl border bg-gradient-to-br p-7 ${feature.gradient} ${feature.border}`}
              >
                <div className="mb-4">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${feature.tagColor}`}
                  >
                    {t(`features.${feature.key}.tag`)}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  {t(`features.${feature.key}.title`)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {t(`features.${feature.key}.description`)}
                </p>
                <div className="pointer-events-none absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-background/30 blur-2xl" />
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ BOTTOM CTA ═══ */}
      <section className="relative overflow-hidden py-28 md:py-36">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, hsl(var(--foreground) / 0.06) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--foreground) / 0.06) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 65% 65% at 50% 50%, hsl(var(--background) / 0.95) 0%, hsl(var(--background) / 0.6) 55%, transparent 100%)",
          }}
        />

        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <span className="inline-block mb-5 text-xs font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">
            {t("cta.label")}
          </span>
          <h2
            className="text-4xl font-normal leading-[1.14] tracking-tight md:text-5xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {t("cta.title_line1")}
            <br />
            {t("cta.title_line2")}
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground md:text-lg">
            {t("cta.description")}
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" className="px-8 shadow-md">
              {t("cta.primary")}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="px-8 bg-background/70 backdrop-blur-sm"
            >
              {t("cta.secondary")}
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
