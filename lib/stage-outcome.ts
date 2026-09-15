export type Outcome = "in-progress" | "offer" | "accepted" | "rejected" | "no-response"

export function stageOutcome(
  stage: { name: string; type: string; terminalResult?: string | null } | undefined
): Outcome {
  if (!stage) return "in-progress"
  if (stage.type === "terminal") {
    if (stage.terminalResult === "accepted") return "accepted"
    if (stage.terminalResult === "rejected") return "rejected"
    if (stage.terminalResult === "no-response") return "no-response"
    return "in-progress"
  }
  if (stage.name === "Офер") return "offer"
  return "in-progress"
}
