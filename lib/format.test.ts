import { describe, expect, it } from "vitest"

import {
  buildCvFilename,
  linkedinUrl,
  phoneHref,
  salaryRange,
  telegramUrl,
} from "./format"

describe("telegramUrl", () => {
  it("strips leading @", () => {
    expect(telegramUrl("@username")).toBe("https://t.me/username")
  })

  it("keeps full links", () => {
    expect(telegramUrl("https://t.me/x")).toBe("https://t.me/x")
  })
})

describe("phoneHref", () => {
  it("builds tel: link and strips formatting", () => {
    expect(phoneHref("+7 (900) 000-00-00")).toBe("tel:+79000000000")
  })
})

describe("linkedinUrl", () => {
  it("prefixes https for plain handles", () => {
    expect(linkedinUrl("linkedin.com/in/x")).toBe("https://linkedin.com/in/x")
  })

  it("keeps full links", () => {
    expect(linkedinUrl("https://linkedin.com/in/x")).toBe("https://linkedin.com/in/x")
  })
})

describe("salaryRange", () => {
  it("renders range with currency", () => {
    expect(salaryRange(100, 200, "USD")).toBe("100–200 USD")
  })

  it("renders single value", () => {
    expect(salaryRange(100, 100, null)).toBe("100")
  })

  it("returns empty when both null", () => {
    expect(salaryRange(null, null, null)).toBe("")
  })
})

describe("buildCvFilename", () => {
  it("builds company_lang_role filename", () => {
    expect(
      buildCvFilename({ company: "Cloud", lang: "ru", role: "Senior Frontend" })
    ).toBe("CV_Cloud_ru_Senior_Frontend.docx")
  })

  it("collapses spaces and unsafe characters", () => {
    expect(
      buildCvFilename({ company: "ACME / Corp", lang: "en", role: "Dev/Ops" })
    ).toBe("CV_ACME_Corp_en_Dev_Ops.docx")
  })

  it("falls back to CV.docx when empty", () => {
    expect(buildCvFilename({})).toBe("CV.docx")
  })
})
