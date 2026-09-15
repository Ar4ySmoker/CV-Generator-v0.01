import { describe, expect, it } from "vitest"

import { stageOutcome } from "./stage-outcome"

describe("stageOutcome", () => {
  it("returns in-progress for active stages", () => {
    expect(stageOutcome({ name: "Собеседование", type: "active" })).toBe(
      "in-progress"
    )
  })

  it("detects offer stage by name", () => {
    expect(stageOutcome({ name: "Офер", type: "active" })).toBe("offer")
  })

  it("maps terminal results", () => {
    expect(
      stageOutcome({ name: "Принято", type: "terminal", terminalResult: "accepted" })
    ).toBe("accepted")
    expect(
      stageOutcome({ name: "Отклонено", type: "terminal", terminalResult: "rejected" })
    ).toBe("rejected")
    expect(
      stageOutcome({ name: "Нет ответа", type: "terminal", terminalResult: "no-response" })
    ).toBe("no-response")
  })

  it("returns in-progress when stage is undefined", () => {
    expect(stageOutcome(undefined)).toBe("in-progress")
  })
})
