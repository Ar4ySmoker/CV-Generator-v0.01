export function formatRelative(iso: string | Date): string {
  const diff = new Date(iso).getTime() - Date.now()
  const mins = Math.round(diff / 60000)
  if (mins < 0) return "прошло"
  if (mins < 60) return `через ${mins} мин`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `через ${hours} ч`
  return `через ${Math.round(hours / 24)} дн`
}

export function timeInStage(iso: string | Date): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "только что"
  if (mins < 60) return `${mins} мин`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} ч`
  const days = Math.floor(hours / 24)
  return `${days} дн`
}

export function ageDays(iso: string | Date): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
}

export function salaryRange(
  min: number | null,
  max: number | null,
  currency: string | null
): string {
  const cur = currency ?? ""
  if (min != null || max != null) {
    const lo = min != null ? String(min) : ""
    const hi = max != null ? String(max) : ""
    const range = hi && lo !== hi ? `${lo}–${hi}` : lo || hi
    return cur ? `${range} ${cur}` : range
  }
  return ""
}
