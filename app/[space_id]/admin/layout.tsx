'use client';

import { redirect, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

import Spaces from "@/components/spaces/spaces";
import SignOutButton from "@/components/auth/signout-button";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { AppSidebar } from "@/components/app-sidebar";
import { useEffect, useState } from "react";
import { User } from "@/lib/db/schema";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  useEffect(() => {
    async function getUser() {
      // const { data, error } = await supabase.auth.getUser();
      const res = await fetch('/api/user');
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        router.refresh();
        router.push('/');
        setUser(null);
      }
    }
    getUser();
  }, []);

  if (!user) {
    return null; // or a loading state
  }

  return (
    <div className="[--header-height:calc(theme(spacing.14))]">
      <SidebarProvider className="flex flex-col">
        <SiteHeader />
        <div className="flex flex-1">
          <AppSidebar />
          <SidebarInset>
            <div className="w-full">
              {children}
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}
