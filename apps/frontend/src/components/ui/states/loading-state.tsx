import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface CardGridSkeletonProps {
  count?: number;
  className?: string;
}

/** Skeleton grid matching the standard card list layout (properties, etc.). */
export function CardGridSkeleton({
  count = 6,
  className,
}: CardGridSkeletonProps) {
  return (
    <section
      className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}
    >
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="space-y-3 rounded-xl border border-border p-6">
          <div className="flex items-start justify-between">
            <Skeleton className="size-10 rounded-lg" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ))}
    </section>
  );
}
