'use client';

import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Activity, 
  ArrowUpRight,
  ArrowDownRight,
  Bell,
  Settings
} from "lucide-react";

const DashboardPage = () => {
  const stats = [
    {
      title: "Total Users",
      value: "1,234",
      icon: Users,
      trend: "+12.5%",
      isPositive: true
    },
    {
      title: "Active Sessions",
      value: "856",
      icon: Activity,
      trend: "+8.2%",
      isPositive: true
    },
    {
      title: "Conversion Rate",
      value: "3.2%",
      icon: ArrowUpRight,
      trend: "-2.4%",
      isPositive: false
    }
  ];

  const recentActivity = [
    {
      user: "John Doe",
      action: "Signed in",
      time: "2 minutes ago"
    },
    {
      user: "Jane Smith",
      action: "Updated profile",
      time: "15 minutes ago"
    },
    {
      user: "Mike Johnson",
      action: "Changed password",
      time: "1 hour ago"
    }
  ];

  return (
    <div className="min-h-screen bg-background p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, Admin</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" size="icon">
            <Bell className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <h3 className="text-2xl font-bold">{stat.value}</h3>
                </div>
              </div>
              <div className={`flex items-center ${stat.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {stat.isPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                <span className="text-sm font-medium">{stat.trend}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Activity</h2>
          <Button variant="ghost" className="text-sm">View all</Button>
        </div>
        <ScrollArea className="h-[300px]">
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index}>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium">{activity.user}</p>
                    <p className="text-sm text-muted-foreground">{activity.action}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{activity.time}</p>
                </div>
                {index !== recentActivity.length - 1 && <Separator />}
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
};

export default DashboardPage;