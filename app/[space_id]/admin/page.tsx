// app/page.tsx

// import { redirect } from "next/navigation";
// import { createClient } from "@/utils/supabase/server";

// import Spaces from "@/components/spaces/spaces";
// import SignOutButton from "@/components/auth/signout-button";
// import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
// import { SiteHeader } from "@/components/site-header";
// import { AppSidebar } from "@/components/app-sidebar";

// export default async function Home() {
//   // const supabase = await createClient();

//   // const { data, error } = await supabase.auth.getUser();

//   // if (error || !data?.user) {
//   //   redirect("/signin");
//   // }

//   return (
//     <div className="flex flex-1 flex-col gap-4 p-4">
//       <div className="grid auto-rows-min gap-4 md:grid-cols-3">
//         <div className="aspect-video rounded-xl bg-muted/50" />
//         <div className="aspect-video rounded-xl bg-muted/50" />
//         <div className="aspect-video rounded-xl bg-muted/50" />
//       </div>
//       <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" />
//     </div>
//   );
// }

"use client"

import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Users, 
  Calendar, 
  UserCheck, 
  Trophy, 
  Settings, 
  BarChart3 
} from "lucide-react";

const navigationCards = [
  {
    title: "Students",
    icon: Users,
    href: "/students",
    description: "Manage students"
  },
  {
    title: "Events",
    icon: Calendar,
    href: "/events",
    description: "Manage events"
  },
  {
    title: "Attendance",
    icon: UserCheck,
    href: "/attendance",
    description: "Take attendance"
  },
  {
    title: "Leaderboard",
    icon: Trophy,
    href: "/leaderboard", 
    description: "View rankings"
  },
  {
    title: "Analytics",
    icon: BarChart3,
    href: "/analytics",
    description: "View reports"
  },
  {
    title: "Settings",
    icon: Settings,
    href: "/settings",
    description: "Space settings"
  }
];

export default function AdminPage() {
  const params = useParams();
  const router = useRouter();
  const spaceId = params?.space_id as string;

  const handleCardClick = (href: string) => {
    router.push(`/${spaceId}/admin${href}`);
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your space and track student progress
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {navigationCards.map((card) => {
          const IconComponent = card.icon;
          return (
            <Card 
              key={card.title}
              className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-2 hover:border-primary/50"
              onClick={() => handleCardClick(card.href)}
            >
              <CardContent className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                <div className="rounded-full bg-primary/10 p-4">
                  <IconComponent className="h-12 w-12 text-primary" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-semibold">{card.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {card.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Stats Section */}
      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                Total Students
              </span>
            </div>
            <div className="text-2xl font-bold">24</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                This Month Events
              </span>
            </div>
            <div className="text-2xl font-bold">8</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <UserCheck className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                Avg Attendance
              </span>
            </div>
            <div className="text-2xl font-bold">87%</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                Active Groups
              </span>
            </div>
            <div className="text-2xl font-bold">6</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
