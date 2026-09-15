import { cn } from "@/lib/utils"

import type { Stage } from "./types"

export function StageBadge({
  stage,
  className,
}: {
  stage?: Stage
  className?: string
}) {
  if (!stage) return null
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-xs font-medium text-foreground",
        className
      )}
    >
      <span
        className="size-2 rounded-full"
        style={{ backgroundColor: stage.color }}
      />
      {stage.name}
    </span>
  )
}
