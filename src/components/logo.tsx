
import { PawPrint } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <PawPrint className="text-primary h-8 w-8" />
      <span className="text-2xl font-headline font-bold text-foreground">
        PawPsych
      </span>
    </div>
  );
}
