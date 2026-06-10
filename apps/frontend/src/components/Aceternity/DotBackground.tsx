import { cn } from "@/lib/utils";
import React from "react";

export function DotBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen h-full w-full items-center justify-center bg-background">
      <div
        className={cn(
          "absolute inset-0",
          "[background-size:20px_20px]",
          "[background-image:radial-gradient(#d4d4d4_1px,transparent_1px)]",
          "dark:[background-image:radial-gradient(#404040_1px,transparent_1px)]"
        )}
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background [mask-image:radial-gradient(ellipse_at_center,transparent_50%,black)]"></div>
      {children}
    </div>
  );
}
