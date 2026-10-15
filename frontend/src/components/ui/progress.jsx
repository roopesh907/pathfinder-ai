
"use client";

import { Progress as ProgressPrimitive } from "@base-ui/react/progress";
import { cn } from "@/lib/utils";

function Progress({
  className,
  children,
  value = 0,
  max = 100,
  ...props
}) {
  const safeMax = Number(max) > 0 ? Number(max) : 100;
  const numericValue = Number(value);
  const safeValue = Number.isFinite(numericValue)
    ? Math.min(safeMax, Math.max(0, numericValue))
    : 0;

  const percentage = (safeValue / safeMax) * 100;

  return (
    <ProgressPrimitive.Root
      value={safeValue}
      max={safeMax}
      data-slot="progress"
      className={cn("flex flex-wrap gap-3", className)}
      {...props}
    >
      {children}

      <ProgressTrack>
        <ProgressIndicator
          style={{ width: `${percentage}%` }}
        />
      </ProgressTrack>
    </ProgressPrimitive.Root>
  );
}

function ProgressTrack({ className, ...props }) {
  return (
    <ProgressPrimitive.Track
      className={cn(
        "relative h-1 w-full overflow-hidden rounded-full bg-muted",
        className
      )}
      data-slot="progress-track"
      {...props}
    />
  );
}

function ProgressIndicator({ className, style, ...props }) {
  return (
    <ProgressPrimitive.Indicator
      data-slot="progress-indicator"
      className={cn(
        "h-full shrink-0 rounded-full bg-primary transition-[width] duration-300 ease-out",
        className
      )}
      style={style}
      {...props}
    />
  );
}

function ProgressLabel({ className, ...props }) {
  return (
    <ProgressPrimitive.Label
      className={cn("text-sm font-medium", className)}
      data-slot="progress-label"
      {...props}
    />
  );
}

function ProgressValue({ className, ...props }) {
  return (
    <ProgressPrimitive.Value
      className={cn(
        "ml-auto text-sm tabular-nums text-muted-foreground",
        className
      )}
      data-slot="progress-value"
      {...props}
    />
  );
}

export {
  Progress,
  ProgressTrack,
  ProgressIndicator,
  ProgressLabel,
  ProgressValue,
};
