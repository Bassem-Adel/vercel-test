'use client';

import { redirect, useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

import Spaces from "@/components/spaces/spaces";
import SignOutButton from "@/components/auth/signout-button";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { AppSidebar } from "@/components/app-sidebar";
import { useEffect, useState } from "react";
import { Space, User } from "@/lib/db/schema";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [space, setSpace] = useState<Space | null>();
  const router = useRouter();
  const params = useParams()
  const spaceId = params?.space_id as string

  async function getUser() {
    try {
      const res = await fetch('/api/user');
      if (res.ok) {
        const data = await res.json();
        return data;
      } else {
        return null;
      }
    } catch (error) {
      console.error("Failed to fetch spaces:", error);
      return null; // Fallback on error
    }
  }

  async function getSpace() {
    try {
      const res = await fetch(`/api/space?spaceId=${spaceId}`);
      if (res.ok) {
        const data = await res.json();
        return data;
      } else {
        return null;
      }
    } catch (error) {
      console.error("Failed to fetch spaces:", error);
      return null; // Fallback on error
    }
  }

  async function loadData() {
    try {
      const [userData, spaceData] = await Promise.all([getUser(), getSpace()]);
      if (!userData || !spaceData) {
        router.refresh();
        router.push('/');
      } else {
        setSpace(spaceData);
        setUser(userData);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      redirect('/'); // Redirect on error
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  if (!user || !space) {
    return null; // or a loading state
  }

  return (
    <div className="[--header-height:calc(theme(spacing.14))]">
      <SidebarProvider className="flex flex-col">
        <SiteHeader headerName={space.name} />
        <div className="flex flex-1">
          <AppSidebar user={user} space={space} />
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
