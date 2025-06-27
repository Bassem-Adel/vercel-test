// components/auth/signout-button.tsx

"use client";

import { signout } from "@/actions/auth/actions";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { DropdownMenuItem } from "../ui/dropdown-menu";

export default function SignOutButton() {
  return (
    // <Button
    //   variant="ghost"
    //   onClick={async () => {
    //     await signout();
    //   }}
    // >
    //   Sign Out
    // </Button>
    <form action={signout} className="w-full">
      <button type="submit" className="flex w-full">
        <DropdownMenuItem className="w-full flex-1 cursor-pointer">
          <LogOut className="h-4 w-4" />
          {/* <LogOut className="mr-2 h-4 w-4" /> */}
          <span>Sign out</span>
        </DropdownMenuItem>
      </button>
    </form>

    // <Button
    //   variant="ghost"
    //   onClick={async () => {
    //     await signout();
    //   }}
    // >
    //   Sign Out
    // </Button>
  );
}
