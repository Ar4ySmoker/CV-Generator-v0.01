import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  TextRun,
  convertInchesToTwip,
} from "docx"

import type { AdaptedCv, CvSection } from "./llm"

const FONT = "Calibri"
const ACCENT = "1F3B63"
const BODY = "222222"
const GRAY = "595F66"

const LINE = Math.round(1.08 * 240)

const half = (pt: number) => Math.round(pt * 2)
const twip = (pt: number) => Math.round(pt * 20)

interface RunOpts {
  size?: number
  bold?: boolean
  italic?: boolean
  color?: string
}

function run(text: string, opts: RunOpts = {}): TextRun {
  return new TextRun({
    text,
    font: FONT,
    size: half(opts.size ?? 10.5),
    bold: opts.bold,
    italics: opts.italic,
    color: opts.color ?? BODY,
  })
}

function para(
  children: TextRun[],
  opts: {
    before?: number
    after?: number
    leftIndentPt?: number
    center?: boolean
  } = {}
): Paragraph {
  return new Paragraph({
    children,
    alignment: opts.center ? AlignmentType.CENTER : AlignmentType.LEFT,
    spacing: {
      before: twip(opts.before ?? 0),
      after: twip(opts.after ?? 4),
      line: LINE,
      lineRule: "auto",
    },
    indent:
      opts.leftIndentPt != null ? { left: twip(opts.leftIndentPt) } : undefined,
  })
}

function textPara(
  text: string,
  opts: { size?: number; bold?: boolean; italic?: boolean; color?: string } & {
    before?: number
    after?: number
    center?: boolean
  } = {}
): Paragraph {
  return para([run(text, opts)], opts)
}

function heading(text: string): Paragraph {
  return new Paragraph({
    children: [run(text, { size: 12, bold: true, color: ACCENT })],
    spacing: {
      before: twip(12),
      after: twip(4),
      line: LINE,
      lineRule: "auto",
    },
    border: {
      bottom: { style: BorderStyle.SINGLE, color: ACCENT, size: 8, space: 2 },
    },
  })
}

function bullet(text: string): Paragraph {
  return new Paragraph({
    children: [run(text)],
    bullet: { level: 0 },
    spacing: { after: twip(2), line: LINE, lineRule: "auto" },
  })
}

type ExperienceItem = Extract<
  CvSection,
  { type: "experience" }
>["items"][number]

type ProjectItem = Extract<
  CvSection,
  { type: "projects" }
>["items"][number]

function renderExperience(
  items: ExperienceItem[],
  techLabel: string
): Paragraph[] {
  const result: Paragraph[] = []
  for (const it of items) {
    const runs: TextRun[] = []
    if (it.period) runs.push(run(it.period, { bold: true }))
    runs.push(run(`  ·  ${it.role}`, { bold: true }))
    const companyPlace = it.company + (it.place ? ` (${it.place})` : "")
    if (companyPlace) runs.push(run(`, ${companyPlace}`))
    if (it.url) runs.push(run(`   ${it.url}`, { size: 9.5, italic: true, color: GRAY }))
    result.push(para(runs, { before: 8, after: 2 }))
    for (const b of it.bullets) {
      result.push(bullet(b))
    }
    if (it.tech) {
      result.push(
        para([run(`${techLabel}: ${it.tech}`, { size: 9.5, italic: true, color: GRAY })], {
          after: 2,
          leftIndentPt: 18,
        })
      )
    }
  }
  return result
}

function renderProjects(items: ProjectItem[], techLabel: string): Paragraph[] {
  const result: Paragraph[] = []
  for (const it of items) {
    const runs: TextRun[] = [run(it.name, { bold: true })]
    if (it.tagline) runs.push(run(` — ${it.tagline}`))
    result.push(para(runs, { before: 8, after: 2 }))
    if (it.desc) result.push(para([run(it.desc)], { after: 2 }))
    for (const b of it.bullets) {
      result.push(bullet(b))
    }
    if (it.tech) {
      result.push(
        para([run(`${techLabel}: ${it.tech}`, { size: 9.5, italic: true, color: GRAY })], {
          after: 2,
          leftIndentPt: 18,
        })
      )
    }
  }
  return result
}

export async function buildDocx(cv: AdaptedCv): Promise<Buffer> {
  const techLabel = cv.lang === "en" ? "Technologies" : "Технологии"

  const children: Paragraph[] = []

  if (cv.name) {
    children.push(textPara(cv.name, { size: 20, bold: true, color: ACCENT, after: 2 }))
  }
  if (cv.title_line) {
    children.push(textPara(cv.title_line, { size: 12, bold: true, after: 2 }))
  }
  if (cv.header_note) {
    children.push(
      textPara(cv.header_note, { size: 10.5, italic: true, color: GRAY, after: 4 })
    )
  }

  if (cv.contacts.length > 0) {
    const runs: TextRun[] = []
    cv.contacts.forEach((c, i) => {
      runs.push(run(c, { size: 10 }))
      if (i < cv.contacts.length - 1) {
        runs.push(run("   |   ", { size: 10, color: GRAY }))
      }
    })
    children.push(para(runs, { after: 6 }))
  }

  for (const sec of cv.sections) {
    if (sec.heading) children.push(heading(sec.heading))
    switch (sec.type) {
      case "paragraph":
        for (const line of sec.lines) children.push(textPara(line))
        break
      case "bullets":
        for (const item of sec.items) children.push(bullet(item))
        break
      case "experience":
        children.push(...renderExperience(sec.items, techLabel))
        break
      case "projects":
        children.push(...renderProjects(sec.items, techLabel))
        break
    }
  }

  const doc = new Document({
    creator: "CV Generator",
    styles: {
      default: {
        document: { run: { font: FONT, size: half(10.5), color: BODY } },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.7),
              bottom: convertInchesToTwip(0.7),
              left: convertInchesToTwip(0.8),
              right: convertInchesToTwip(0.8),
            },
          },
        },
        children,
      },
    ],
  })

  return Packer.toBuffer(doc)
}
