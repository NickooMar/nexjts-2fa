import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title: string;
  description?: string;
  retryLabel?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  className?: string;
}

/** Standard error panel for failed queries, with an optional retry action. */
export function ErrorState({
  title,
  description,
  retryLabel,
  onRetry,
  isRetrying,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-10 text-center",
        className
      )}
    >
      <TriangleAlert className="size-8 text-destructive" />
      <p className="font-medium">{title}</p>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {onRetry && retryLabel && (
        <Button variant="outline" onClick={onRetry} disabled={isRetrying}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
