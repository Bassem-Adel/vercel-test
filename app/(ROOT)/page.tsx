// app/page.tsx

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

import Spaces from "@/components/spaces/spaces";
import SignOutButton from "@/components/auth/signout-button";

export default async function Home() {
  // const supabase = await createClient();

  // const { data, error } = await supabase.auth.getUser();

  // if (error || !data?.user) {
  //   redirect("/signin");
  // }

  return (
    <main className="flex flex-1 flex-col justify-between items-center">
      {/* <main className="min-h-screen flex flex-col gap-4 items-center justify-center"> */}
      <Spaces />
      <p className="mt-6 text-center text-muted-foreground">Version 0.1.2</p>
    </main>
  );
}