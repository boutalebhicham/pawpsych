import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="text-2xl font-bold text-foreground" style={{ fontFamily: 'sans-serif', letterSpacing: '-0.02em' }}>
        Âme Animale
      </span>
    </div>
  );
}
