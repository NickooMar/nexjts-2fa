"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import {
  Building2,
  Users,
  DollarSign,
  Plus,
  FileText,
  UserPlus,
  Home,
  MapPin,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Eye,
  Edit,
  FileSignature,
  PlusCircle,
  RefreshCw,
  Key,
  CheckCircle,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// Mock Data
const stats = [
  {
    title: "Total Properties",
    value: "310",
    icon: Building2,
    change: "+12 this month",
    changeType: "positive",
  },
  {
    title: "Available",
    value: "45",
    icon: Key,
    change: "-5 this month",
    changeType: "negative",
  },
  {
    title: "Rented / Sold",
    value: "265",
    icon: CheckCircle,
    change: "+17 this month",
    changeType: "positive",
  },
  {
    title: "Total Clients",
    value: "1,204",
    icon: Users,
    change: "+84 this month",
    changeType: "positive",
  },
  {
    title: "Monthly Revenue",
    value: "$1.2M",
    icon: DollarSign,
    change: "+14.2% YoY",
    changeType: "positive",
  },
];

const featuredProperties = [
  {
    id: 1,
    title: "Skyline Residences",
    location: "12 Pinnacle Blvd, Dist. 1",
    price: "$2,500/mo",
    status: "Available",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=400&h=250",
  },
  {
    id: 2,
    title: "Harbor View Tower",
    location: "88 Maritime Ave, Dist. 3",
    price: "$4,200/mo",
    status: "Rented",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=400&h=250",
  },
  {
    id: 3,
    title: "The Meridian Complex",
    location: "44 Central Park Blvd",
    price: "$850,000",
    status: "Sold",
    image: "https://images.unsplash.com/photo-1600607687931-5701d6713ed6?auto=format&fit=crop&q=80&w=400&h=250",
  },
];

const recentActivity = [
  {
    id: 1,
    user: "Sarah Jenkins",
    action: "added a new property",
    target: "Westside Industrial",
    time: "2 hours ago",
    icon: PlusCircle,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    id: 2,
    user: "Mike Ross",
    action: "updated the status of",
    target: "The Lofts",
    time: "5 hours ago",
    icon: RefreshCw,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  {
    id: 3,
    user: "Elena Gilbert",
    action: "registered as a new client",
    target: "",
    time: "1 day ago",
    icon: UserPlus,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    id: 4,
    user: "System",
    action: "generated monthly report for",
    target: "November 2024",
    time: "2 days ago",
    icon: FileText,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
];

const quickActions = [
  { label: "Add new property", icon: Plus, href: "/properties/new" },
  { label: "Register new client", icon: UserPlus, href: "/clients/new" },
  { label: "Create contract", icon: FileSignature, href: "/contracts/new" },
  { label: "Generate report", icon: FileText, href: "/reports/new" },
];

export default function HomePage() {
  const { data: session } = useSession();
  const userName = session?.user?.name || session?.user?.email?.split("@")[0] || "User";

  return (
    <div className="min-h-screen w-full bg-muted/20">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* HERO SECTION */}
        <section className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Welcome back, {userName}
            </h1>
            <p className="mt-2 text-base text-muted-foreground">
              Manage your properties, clients, and view operational insights—all from your central command hub.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Add Property
            </Button>
            <Button variant="outline" className="gap-2">
              <Building2 className="h-4 w-4" /> View Properties
            </Button>
            <Button variant="outline" className="gap-2">
              <UserPlus className="h-4 w-4" /> Add Client
            </Button>
            <Button variant="outline" className="gap-2">
              <FileText className="h-4 w-4" /> View Reports
            </Button>
          </div>
        </section>

        {/* STATISTICS / KPI CARDS */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {stats.map((stat) => (
            <Card key={stat.title} className="border-border/80 bg-card shadow-sm">
              <CardContent className="flex flex-col gap-3 p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <div className="rounded-full bg-primary/10 p-2">
                    <stat.icon className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">
                    {stat.value}
                  </h2>
                  <div
                    className={`mt-1 flex items-center text-xs font-medium ${
                      stat.changeType === "positive"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {stat.changeType === "positive" ? (
                      <TrendingUp className="mr-1 h-3 w-3" />
                    ) : (
                      <TrendingDown className="mr-1 h-3 w-3" />
                    )}
                    {stat.change}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* LEFT COLUMN: FEATURED PROPERTIES */}
          <div className="flex flex-col gap-6 lg:col-span-2">
            <section>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">
                    Featured Properties
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Latest properties added to your portfolio.
                  </p>
                </div>
                <Button variant="ghost" size="sm" className="gap-1 text-sm">
                  View all
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {featuredProperties.map((property) => (
                  <Card
                    key={property.id}
                    className="group overflow-hidden border-border/80 bg-card shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                      <Image
                        src={property.image}
                        alt={property.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        unoptimized
                      />
                      <div className="absolute left-3 top-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm backdrop-blur-md ${
                            property.status === "Available"
                              ? "bg-emerald-500/90 text-white"
                              : property.status === "Rented"
                              ? "bg-sky-500/90 text-white"
                              : "bg-amber-500/90 text-white"
                          }`}
                        >
                          {property.status}
                        </span>
                      </div>
                    </div>
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="line-clamp-1 text-base">
                          {property.title}
                        </CardTitle>
                        <p className="shrink-0 font-semibold text-primary">
                          {property.price}
                        </p>
                      </div>
                      <CardDescription className="flex items-center gap-1.5 text-xs">
                        <MapPin className="h-3.5 w-3.5" />
                        <span className="truncate">{property.location}</span>
                      </CardDescription>
                    </CardHeader>
                    <Separator className="my-2" />
                    <CardFooter className="flex items-center justify-between p-4 pt-2">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="h-8 gap-1.5 px-3">
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Edit className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: QUICK ACTIONS & RECENT ACTIVITY */}
          <div className="flex flex-col gap-6">
            {/* QUICK ACTIONS PANEL */}
            <section>
              <div className="mb-4">
                <h2 className="text-lg font-semibold tracking-tight">
                  Quick Actions
                </h2>
                <p className="text-sm text-muted-foreground">
                  Shortcuts to common workflows.
                </p>
              </div>
              <Card className="border-border/80 bg-card shadow-sm">
                <CardContent className="grid gap-2 p-4">
                  {quickActions.map((action) => (
                    <Button
                      key={action.label}
                      variant="outline"
                      className="h-auto w-full justify-start gap-3 border-border/50 px-4 py-3 hover:bg-muted/50"
                      asChild
                    >
                      <Link href={action.href}>
                        <div className="rounded-md bg-primary/10 p-2 text-primary">
                          <action.icon className="h-4 w-4" />
                        </div>
                        <span className="font-medium">{action.label}</span>
                      </Link>
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </section>

            {/* RECENT ACTIVITY */}
            <section>
              <div className="mb-4">
                <h2 className="text-lg font-semibold tracking-tight">
                  Recent Activity
                </h2>
                <p className="text-sm text-muted-foreground">
                  Latest updates and changes in the system.
                </p>
              </div>
              <Card className="border-border/80 bg-card shadow-sm">
                <CardContent className="p-0">
                  <div className="flex flex-col">
                    {recentActivity.map((activity, index) => (
                      <div key={activity.id}>
                        <div className="flex items-start gap-4 p-4 hover:bg-muted/30">
                          <div
                            className={`mt-0.5 rounded-full p-2 ${activity.bgColor}`}
                          >
                            <activity.icon
                              className={`h-4 w-4 ${activity.color}`}
                            />
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="text-sm text-foreground">
                              <span className="font-semibold text-foreground">
                                {activity.user}
                              </span>{" "}
                              {activity.action}{" "}
                              {activity.target && (
                                <span className="font-medium text-foreground">
                                  {activity.target}
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {activity.time}
                            </p>
                          </div>
                        </div>
                        {index < recentActivity.length - 1 && (
                          <Separator className="mx-4 w-auto" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
