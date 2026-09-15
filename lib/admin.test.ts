import { afterEach, describe, expect, it } from "vitest"

import { isAdminEmail } from "./admin"

afterEach(() => {
  delete process.env.ADMIN_EMAILS
})

describe("isAdminEmail", () => {
  it("returns true for the default admin", () => {
    expect(isAdminEmail("blagox8@gmail.com")).toBe(true)
    expect(isAdminEmail("BLAGOX8@GMAIL.COM")).toBe(true)
  })

  it("returns false for others", () => {
    expect(isAdminEmail("friend@example.com")).toBe(false)
    expect(isAdminEmail(null)).toBe(false)
  })

  it("respects ADMIN_EMAILS override", () => {
    process.env.ADMIN_EMAILS = "a@x.com,b@x.com"
    expect(isAdminEmail("b@x.com")).toBe(true)
    expect(isAdminEmail("blagox8@gmail.com")).toBe(false)
  })
})
