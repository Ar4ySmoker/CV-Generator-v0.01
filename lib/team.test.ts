import { describe, expect, it } from "vitest"

import { generateInviteCode, normalizeCompany } from "./team"

describe("normalizeCompany", () => {
  it("lowercases and collapses whitespace", () => {
    expect(normalizeCompany("  Яндекс   Плюс ")).toBe("яндекс плюс")
  })

  it("keeps single words intact", () => {
    expect(normalizeCompany("Yandex")).toBe("yandex")
  })
})

describe("generateInviteCode", () => {
  it("returns a non-empty string", () => {
    expect(generateInviteCode().length).toBeGreaterThan(0)
  })

  it("returns unique codes", () => {
    const a = generateInviteCode()
    const b = generateInviteCode()
    expect(a).not.toBe(b)
  })
})
