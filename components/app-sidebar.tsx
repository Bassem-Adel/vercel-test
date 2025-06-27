"use client"

import * as React from "react"
import {
  BookOpen,
  Bot,
  CalendarCheck,
  CalendarDays,
  Command,
  Frame,
  Layers,
  LifeBuoy,
  ListChecks,
  Map,
  PieChart,
  Send,
  Settings,
  Settings2,
  SquareTerminal,
  User as ReactUserIcon,
  Users,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useParams } from "next/navigation"
import { Space, User } from "@/lib/db/schema";
import Link from "next/link"


function getSidebarData(spaceId?: string, user?: User) {
  return {
  user: {
    name: user?.name || "Unkown User",
    email: user?.email || "me@example.com",
    avatar: `https://ui-avatars.com/api/?name=${user?.name || "Unkown User"}&background=random`,
  },
  navMain: [
    {
      title: "Students",
      url: spaceId ? `/${spaceId}/admin/students` : "#",
      icon: ReactUserIcon,
      // icon: SquareTerminal,
      isActive: true,
      // items: [
      //   {
      //     title: "History",
      //     url: "#",
      //   },
      //   {
      //     title: "Starred",
      //     url: "#",
      //   },
      //   {
      //     title: "Settings",
      //     url: "#",
      //   },
      // ],
    },
    {
      title: "Groups",
      url: spaceId ? `/${spaceId}/admin/groups` : "#",
      icon: Users,
      // icon: Layers,
      // icon: Bot,
      // items: [
      //   {
      //     title: "Genesis",
      //     url: "#",
      //   },
      //   {
      //     title: "Explorer",
      //     url: "#",
      //   },
      //   {
      //     title: "Quantum",
      //     url: "#",
      //   },
      // ],
    },
    {
      title: "Event Types",
      url: spaceId ? `/${spaceId}/admin/types` : "#",
      icon: ListChecks,
      // icon: BookOpen,
      // items: [
      //   {
      //     title: "Introduction",
      //     url: "#",
      //   },
      //   {
      //     title: "Get Started",
      //     url: "#",
      //   },
      //   {
      //     title: "Tutorials",
      //     url: "#",
      //   },
      //   {
      //     title: "Changelog",
      //     url: "#",
      //   },
      // ],
    },
    {
      title: "Events",
      url: spaceId ? `/${spaceId}/admin/events` : "#",
      icon: CalendarDays,
      // items: [
      //   {
      //     title: "General",
      //     url: "#",
      //   },
      //   {
      //     title: "Team",
      //     url: "#",
      //   },
      //   {
      //     title: "Billing",
      //     url: "#",
      //   },
      //   {
      //     title: "Limits",
      //     url: "#",
      //   },
      // ],
    },
    {
      title: "Attendance",
      url: spaceId ? `/${spaceId}/admin/attendance` : "#",
      icon: CalendarCheck,
      // icon: Settings2,
    },
    {
      title: "Users",
      url: spaceId ? `/${spaceId}/admin/users` : "#",
      icon: Settings,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
    },
    // {
    //   title: "Support",
    //   url: "#",
    //   icon: LifeBuoy,
    // },
    // {
    //   title: "Feedback",
    //   url: "#",
    //   icon: Send,
    // },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ],
};
}

export function AppSidebar({ user, space, ...props }: React.ComponentProps<typeof Sidebar> & {
  user?: User;
  space?: Space;
}) {
  const params = useParams()
  const spaceId = params?.space_id as string | undefined;
  
  const data = getSidebarData(spaceId, user);
  return (
    <Sidebar
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href={`/${spaceId}/admin`}>
                {/* <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"> */}
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-transparent text-sidebar-primary-foreground">
                  {/* <Command className="size-4" /> */}
                  <img src="/checked.png" alt="Logo" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{space?.name}</span>
                  <span className="truncate text-xs">Enterprise</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
        <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
