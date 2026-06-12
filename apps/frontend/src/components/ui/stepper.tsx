"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StepperStep {
  id: string;
  title: string;
  description?: string;
}

interface StepperProps {
  steps: StepperStep[];
  /** Index of the active step. */
  current: number;
  /** Completed steps are clickable to navigate back. */
  onStepClick?: (index: number) => void;
  className?: string;
}

/**
 * Horizontal wizard stepper. Completed steps render a check and stay
 * clickable so users can go back; future steps are inert until reached.
 */
export function Stepper({
  steps,
  current,
  onStepClick,
  className,
}: StepperProps) {
  return (
    <ol className={cn("flex w-full items-start gap-2", className)}>
      {steps.map((step, index) => {
        const isCompleted = index < current;
        const isCurrent = index === current;
        const isClickable = isCompleted && Boolean(onStepClick);

        return (
          <li
            key={step.id}
            className={cn("flex flex-1 items-start gap-2", {
              "flex-none": index === steps.length - 1,
            })}
          >
            <button
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onStepClick?.(index)}
              aria-current={isCurrent ? "step" : undefined}
              className={cn(
                "group flex min-w-0 items-center gap-3 text-left",
                isClickable && "cursor-pointer"
              )}
            >
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
                  isCompleted &&
                    "border-primary bg-primary text-primary-foreground group-hover:bg-primary/90",
                  isCurrent && "border-primary text-primary",
                  !isCompleted &&
                    !isCurrent &&
                    "border-border text-muted-foreground"
                )}
              >
                {isCompleted ? <Check className="size-4" /> : index + 1}
              </span>
              <span className="hidden min-w-0 flex-col sm:flex">
                <span
                  className={cn(
                    "truncate text-sm font-medium",
                    isCurrent || isCompleted
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {step.title}
                </span>
                {step.description && (
                  <span className="truncate text-xs text-muted-foreground">
                    {step.description}
                  </span>
                )}
              </span>
            </button>
            {index < steps.length - 1 && (
              <span
                aria-hidden
                className={cn(
                  "mt-4 h-0.5 flex-1 rounded-full transition-colors",
                  isCompleted ? "bg-primary" : "bg-border"
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
