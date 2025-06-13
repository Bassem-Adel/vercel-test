// app/page.tsx

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

import Spaces from "@/components/spaces/spaces";
import SignOutButton from "@/components/auth/signout-button";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { AppSidebar } from "@/components/app-sidebar";

export default async function Home() {
  // const supabase = await createClient();

  // const { data, error } = await supabase.auth.getUser();

  // if (error || !data?.user) {
  //   redirect("/signin");
  // }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <div className="aspect-video rounded-xl bg-muted/50" />
        <div className="aspect-video rounded-xl bg-muted/50" />
        <div className="aspect-video rounded-xl bg-muted/50" />
      </div>
      <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" />
    </div>
  );
}
