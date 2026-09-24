import { describe, expect, it } from "vitest"

import {
  buildCvFilename,
  contentDispositionAttachment,
  filenameFromContentDisposition,
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

describe("contentDispositionAttachment", () => {
  it("keeps ASCII filenames plain", () => {
    expect(contentDispositionAttachment("CV_Cloud_ru_Senior_Frontend.docx")).toBe(
      'attachment; filename="CV_Cloud_ru_Senior_Frontend.docx"'
    )
  })

  it("encodes non-ASCII filenames with RFC 5987", () => {
    const header = contentDispositionAttachment("CV_Астон_ru_Стажер.docx")
    expect(header).toContain('filename="CV.docx"')
    expect(header).toContain("filename*=UTF-8''")
  })
})

describe("filenameFromContentDisposition", () => {
  it("decodes UTF-8 filename", () => {
    const header =
      "attachment; filename=\"CV.docx\"; filename*=UTF-8''CV_%D0%90%D1%81%D1%82%D0%BE%D0%BD_ru_%D0%A1%D1%82%D0%B0%D0%B6%D0%B5%D1%80.docx"
    expect(filenameFromContentDisposition(header)).toBe(
      "CV_Астон_ru_Стажер.docx"
    )
  })

  it("falls back to plain filename", () => {
    expect(
      filenameFromContentDisposition(
        'attachment; filename="CV_Cloud_ru_Senior.docx"'
      )
    ).toBe("CV_Cloud_ru_Senior.docx")
  })

  it("returns CV.docx when header is missing", () => {
    expect(filenameFromContentDisposition(null)).toBe("CV.docx")
  })
})
