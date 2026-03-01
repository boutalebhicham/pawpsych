"use client";

import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { adminLogout } from "./actions";

export function AdminLogoutButton() {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={async () => {
        await adminLogout();
        window.location.reload();
      }}
    >
      <LogOut className="h-4 w-4 mr-1" />
      Déconnexion
    </Button>
  );
}
