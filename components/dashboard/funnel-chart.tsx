import type { Stage } from "@/components/applications/types"

export function FunnelChart({
  stages,
  counts,
}: {
  stages: Stage[]
  counts: Map<string, number>
}) {
  const total = Math.max(
    1,
    [...counts.values()].reduce((a, b) => a + b, 0)
  )
  const ordered = [...stages].sort((a, b) => a.order - b.order)

  return (
    <div className="flex flex-col gap-3">
      {ordered.map((stage, i) => {
        const count = counts.get(stage.id) ?? 0
        const prevCount = i > 0 ? counts.get(ordered[i - 1].id) ?? 0 : null
        const conversion =
          prevCount != null && prevCount > 0
            ? Math.round((count / prevCount) * 100)
            : null

        return (
          <div key={stage.id} className="flex items-center gap-3 text-sm">
            <div className="flex w-40 shrink-0 items-center gap-2">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: stage.color }}
              />
              <span className="truncate">{stage.name}</span>
            </div>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(count / total) * 100}%`,
                  backgroundColor: stage.color,
                }}
              />
            </div>
            <span className="w-10 shrink-0 text-right font-medium">
              {count}
            </span>
            <span className="w-14 shrink-0 text-right text-xs text-muted-foreground">
              {conversion != null ? `${conversion}%` : ""}
            </span>
          </div>
        )
      })}
    </div>
  )
}
