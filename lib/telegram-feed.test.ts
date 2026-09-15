import { describe, expect, it } from "vitest"

import { normalizeChannelUsername } from "./telegram-feed"

describe("normalizeChannelUsername", () => {
  it("strips @ prefix", () => {
    expect(normalizeChannelUsername("@remote_jobs")).toBe("remote_jobs")
  })

  it("strips t.me URL", () => {
    expect(normalizeChannelUsername("https://t.me/remote_jobs")).toBe(
      "remote_jobs"
    )
  })

  it("strips t.me/s/ URL", () => {
    expect(normalizeChannelUsername("t.me/s/for_geeks")).toBe("for_geeks")
  })

  it("keeps plain username", () => {
    expect(normalizeChannelUsername("remote_jobs")).toBe("remote_jobs")
  })
})
