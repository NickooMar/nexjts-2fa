"use client";

import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Eye,
  Home,
  Plus,
  MapPin,
  Download,
  Landmark,
  Settings,
  Sparkles,
  BarChart3,
  Building2,
  Warehouse,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import {
  Area,
  XAxis,
  Tooltip,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type TimeRange = "24H" | "7D" | "30D" | "1Y";

type RevenuePoint = {
  t: string;
  v: number;
};

type Property = {
  label: string;
  name: string;
  address: string;
  type: string;
  occupancy: number;
  units: number;
  icon: LucideIcon;
};

type ActionCard = {
  label: string;
  hint: string;
  icon: LucideIcon;
};

const revenueData: Record<TimeRange, RevenuePoint[]> = {
  "24H": [
    { t: "0h", v: 12400 },
    { t: "4h", v: 11200 },
    { t: "8h", v: 18600 },
    { t: "12h", v: 24100 },
    { t: "16h", v: 19800 },
    { t: "20h", v: 15300 },
    { t: "24h", v: 13200 },
  ],
  "7D": [
    { t: "Mon", v: 68000 },
    { t: "Tue", v: 74000 },
    { t: "Wed", v: 61000 },
    { t: "Thu", v: 88000 },
    { t: "Fri", v: 92000 },
    { t: "Sat", v: 45000 },
    { t: "Sun", v: 38000 },
  ],
  "30D": [
    { t: "W1", v: 285000 },
    { t: "W2", v: 312000 },
    { t: "W3", v: 298000 },
    { t: "W4", v: 341000 },
  ],
  "1Y": [
    { t: "Jan", v: 420000 },
    { t: "Feb", v: 385000 },
    { t: "Mar", v: 510000 },
    { t: "Apr", v: 475000 },
    { t: "May", v: 530000 },
    { t: "Jun", v: 620000 },
    { t: "Jul", v: 580000 },
    { t: "Aug", v: 650000 },
    { t: "Sep", v: 710000 },
    { t: "Oct", v: 690000 },
    { t: "Nov", v: 750000 },
    { t: "Dec", v: 820000 },
  ],
};

const portfolioStats = [
  { label: "Total Revenue", value: "$7.1M", change: "+14.2%" },
  { label: "Active Leases", value: "89", change: "+6.4%" },
  { label: "Net Income", value: "$4.4M", change: "+10.8%" },
  { label: "Average Rate", value: "$2.3K", change: "+2.1%" },
];

const performanceMetrics = [
  { label: "Occupancy Rate", value: 78, note: "portfolio-wide" },
  { label: "Revenue Target", value: 92, note: "on track" },
  { label: "ROI", value: 84, note: "quarter average" },
  { label: "Client Satisfaction", value: 75, note: "last survey" },
];

const actionCards: ActionCard[] = [
  { label: "Add Listing", hint: "Create a new property", icon: Plus },
  { label: "Analytics", hint: "Deep performance view", icon: BarChart3 },
  { label: "Export Report", hint: "Download latest insights", icon: Download },
  { label: "Settings", hint: "Manage dashboard modules", icon: Settings },
];

const properties: Property[] = [
  {
    label: "New Listing",
    name: "Skyline Residences",
    address: "12 Pinnacle Blvd, Dist. 1",
    type: "Residential",
    occupancy: 94,
    units: 132,
    icon: Home,
  },
  {
    label: "District 3",
    name: "Harbor View Tower",
    address: "88 Maritime Ave, Dist. 3",
    type: "Mixed-Use",
    occupancy: 96,
    units: 86,
    icon: Building2,
  },
  {
    label: "City Center",
    name: "The Meridian Complex",
    address: "44 Central Park Blvd",
    type: "Commercial",
    occupancy: 72,
    units: 110,
    icon: Landmark,
  },
  {
    label: "Zone B",
    name: "Greenfield Business Park",
    address: "200 Greenfield Dr, Zone B",
    type: "Commercial",
    occupancy: 88,
    units: 74,
    icon: Building2,
  },
  {
    label: "Outskirts",
    name: "Westside Industrial",
    address: "Lot 7, Industrial Estate",
    type: "Industrial",
    occupancy: 81,
    units: 42,
    icon: Warehouse,
  },
  {
    label: "District 5",
    name: "The Lofts",
    address: "22 Artisan Quarter, D5",
    type: "Residential",
    occupancy: 90,
    units: 58,
    icon: Home,
  },
];

function formatCompactCurrency(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value}`;
}

function getOccupancyPillClassName(occupancy: number) {
  if (occupancy >= 90)
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
  if (occupancy >= 80)
    return "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400";
  return "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400";
}

function DottedProgress({ value }: { value: number }) {
  const total = 24;
  const filled = Math.round((value / 100) * total);

  return (
    <div className="flex flex-1 items-center gap-1">
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className="h-1 w-1 rounded-full"
          style={{
            background:
              index < filled
                ? "hsl(var(--primary))"
                : "hsl(var(--foreground) / 0.12)",
          }}
        />
      ))}
    </div>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-foreground">{label}</p>
      <p className="mt-0.5 font-mono text-muted-foreground">
        {formatCompactCurrency(payload[0].value)}
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("30D");

  const currentRevenueData = useMemo(() => revenueData[timeRange], [timeRange]);
  const totalRevenue = useMemo(
    () => currentRevenueData.reduce((sum, point) => sum + point.v, 0),
    [currentRevenueData]
  );
  const occupancyAverage = Math.round(
    properties.reduce((sum, property) => sum + property.occupancy, 0) /
      properties.length
  );

  return (
    <div className="min-h-screen w-full bg-muted/20">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <Card className="relative overflow-hidden border-border/70 bg-card shadow-sm">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.16),transparent_40%)]" />
          <CardHeader className="relative gap-4 pb-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Dashboard / Portfolio Overview
              </p>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="h-8 gap-1.5">
                  <Download className="h-3.5 w-3.5" />
                  Export
                </Button>
                <Button size="sm" className="h-8 gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  New Property
                </Button>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <CardTitle className="text-2xl tracking-tight sm:text-3xl">
                HomiQ Portfolio Dashboard
              </CardTitle>
              <CardDescription className="max-w-2xl text-sm">
                Monitor portfolio health, revenue momentum, and occupancy across
                all active properties in one place.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="relative grid gap-3 pt-0 sm:grid-cols-3">
            <div className="rounded-lg border border-border/70 bg-background/60 p-3">
              <p className="text-xs text-muted-foreground">Last update</p>
              <p className="mt-1 text-lg font-semibold">Dec 28, 2024</p>
            </div>
            <div className="rounded-lg border border-border/70 bg-background/60 p-3">
              <p className="text-xs text-muted-foreground">
                Managed properties
              </p>
              <p className="mt-1 text-lg font-semibold">310 assets</p>
            </div>
            <div className="rounded-lg border border-border/70 bg-background/60 p-3">
              <p className="text-xs text-muted-foreground">Average occupancy</p>
              <p className="mt-1 text-lg font-semibold">{occupancyAverage}%</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {actionCards.map((card) => (
            <button
              key={card.label}
              type="button"
              className="group flex h-full items-start gap-3 rounded-xl border border-border bg-card p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
            >
              <div className="rounded-md border border-border/70 bg-muted p-2">
                <card.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">
                  {card.label}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {card.hint}
                </p>
              </div>
              <ArrowUpRight className="mt-0.5 h-4 w-4 text-muted-foreground transition group-hover:text-primary" />
            </button>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {portfolioStats.map((stat) => (
            <Card
              key={stat.label}
              className="border-border/80 bg-card shadow-sm"
            >
              <CardContent className="flex items-start justify-between p-4">
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="mt-1 text-2xl font-bold tracking-tight">
                    {stat.value}
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                    <TrendingUp className="h-3 w-3" />
                    {stat.change}
                  </div>
                </div>
                <div className="rounded-full bg-primary/10 p-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-12">
          <Card className="border-border/80 xl:col-span-8">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>Revenue Performance</CardTitle>
                  <CardDescription>
                    Live trend across your selected time range.
                  </CardDescription>
                </div>
                <div className="inline-flex rounded-md border border-border bg-background p-1">
                  {(["24H", "7D", "30D", "1Y"] as TimeRange[]).map((range) => (
                    <button
                      key={range}
                      type="button"
                      onClick={() => setTimeRange(range)}
                      className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                        timeRange === range
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-[280px] w-full rounded-lg border border-border/70 bg-background/70 p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={currentRevenueData}
                    margin={{ top: 12, right: 10, left: -12, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="revenueGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="hsl(var(--primary))"
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="95%"
                          stopColor="hsl(var(--primary))"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      stroke="hsl(var(--border))"
                      strokeDasharray="3 3"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="t"
                      tick={{
                        fontSize: 11,
                        fill: "hsl(var(--muted-foreground))",
                      }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="v"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fill="url(#revenueGradient)"
                      dot={{ r: 2.5, fill: "hsl(var(--primary))" }}
                      activeDot={{ r: 4, fill: "hsl(var(--primary))" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Range total</p>
                  <p className="mt-1 text-lg font-semibold">
                    {formatCompactCurrency(totalRevenue)}
                  </p>
                </div>
                <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Top performer</p>
                  <p className="mt-1 text-lg font-semibold">Harbor View</p>
                </div>
                <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">
                    Leasing velocity
                  </p>
                  <p className="mt-1 text-lg font-semibold">+11.3%</p>
                </div>
                <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Churn risk</p>
                  <p className="mt-1 text-lg font-semibold">Low</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/80 xl:col-span-4">
            <CardHeader className="pb-3">
              <CardTitle>Performance Radar</CardTitle>
              <CardDescription>
                Operational scorecard from latest review cycle.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {performanceMetrics.map((metric) => (
                <div key={metric.label} className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">{metric.label}</p>
                    <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                      {metric.value}%
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <DottedProgress value={metric.value} />
                    <span className="w-24 text-right text-[11px] text-muted-foreground">
                      {metric.note}
                    </span>
                  </div>
                </div>
              ))}
              <Separator />
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-300">
                Performance remains healthy this week. Prioritize low-occupancy
                assets for proactive leasing campaigns.
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/80 bg-card">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-2">
                <Building2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-semibold">
                  Featured: Harbor View Tower
                </p>
                <p className="text-xs text-muted-foreground">
                  96% occupancy, 86 units, +19% YoY revenue growth
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8">
                Manage Listing
              </Button>
              <Button size="sm" className="h-8 gap-1.5">
                <Eye className="h-3.5 w-3.5" />
                View Property
              </Button>
            </div>
          </CardContent>
        </Card>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Property Snapshot</h2>
              <p className="text-sm text-muted-foreground">
                Quick health view for high-priority properties.
              </p>
            </div>
            <Button variant="ghost" size="sm" className="gap-1 text-xs">
              Open full portfolio
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {properties.map((property) => (
              <article
                key={property.name}
                className="group rounded-xl border border-border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                    {property.label}
                  </span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${getOccupancyPillClassName(
                      property.occupancy
                    )}`}
                  >
                    {property.occupancy}% occupancy
                  </span>
                </div>

                <div className="mb-3 flex items-center gap-2">
                  <div className="rounded-md border border-border bg-muted p-1.5">
                    <property.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold">
                      {property.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {property.type} • {property.units} units
                    </p>
                  </div>
                </div>

                <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="truncate">{property.address}</span>
                </div>

                <div className="h-1.5 w-full rounded-full bg-muted">
                  <div
                    className="h-1.5 rounded-full bg-primary transition-all"
                    style={{ width: `${property.occupancy}%` }}
                  />
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
