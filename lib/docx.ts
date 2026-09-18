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
import { cvTemplateById, type CvThemeStyle } from "./cv-templates"

export { CV_TEMPLATES, cvTemplateById } from "./cv-templates"
export type { CvTemplate, CvTemplateId, CvThemeStyle } from "./cv-templates"

interface Theme {
  font: string
  accent: string
  body: string
  gray: string
  heading: "underline" | "bar" | "plain"
  accentRule: boolean
}

export interface BuildDocxOptions {
  template?: string
  accentColor?: string
  theme?: CvThemeStyle
}

const LINE = Math.round(1.08 * 240)

const half = (pt: number) => Math.round(pt * 2)
const twip = (pt: number) => Math.round(pt * 20)

interface RunOpts {
  size?: number
  bold?: boolean
  italic?: boolean
  color?: string
}

function run(text: string, theme: Theme, opts: RunOpts = {}): TextRun {
  return new TextRun({
    text,
    font: theme.font,
    size: half(opts.size ?? 10.5),
    bold: opts.bold,
    italics: opts.italic,
    color: opts.color ?? theme.body,
  })
}

function para(
  theme: Theme,
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
  theme: Theme,
  opts: { size?: number; bold?: boolean; italic?: boolean; color?: string } & {
    before?: number
    after?: number
    center?: boolean
  } = {}
): Paragraph {
  return para(theme, [run(text, theme, opts)], opts)
}

function heading(text: string, theme: Theme): Paragraph {
  const spacing = {
    before: twip(12),
    after: twip(4),
    line: LINE,
    lineRule: "auto" as const,
  }
  const child = [run(text, theme, { size: 12, bold: true, color: theme.accent })]

  if (theme.heading === "bar") {
    return new Paragraph({
      children: child,
      spacing,
      border: {
        left: {
          style: BorderStyle.SINGLE,
          color: theme.accent,
          size: 18,
          space: 4,
        },
      },
    })
  }
  if (theme.heading === "plain") {
    return new Paragraph({ children: child, spacing })
  }
  return new Paragraph({
    children: child,
    spacing,
    border: {
      bottom: {
        style: BorderStyle.SINGLE,
        color: theme.accent,
        size: 8,
        space: 2,
      },
    },
  })
}

function accentRule(theme: Theme): Paragraph {
  return new Paragraph({
    children: [],
    spacing: { before: twip(6), after: twip(8) },
    border: {
      bottom: {
        style: BorderStyle.SINGLE,
        color: theme.accent,
        size: 12,
        space: 2,
      },
    },
  })
}

function bullet(text: string, theme: Theme): Paragraph {
  return new Paragraph({
    children: [run(text, theme)],
    bullet: { level: 0 },
    spacing: { after: twip(2), line: LINE, lineRule: "auto" },
  })
}

type ExperienceItem = Extract<
  CvSection,
  { type: "experience" }
>["items"][number]

type ProjectItem = Extract<CvSection, { type: "projects" }>["items"][number]

function renderExperience(
  items: ExperienceItem[],
  techLabel: string,
  theme: Theme
): Paragraph[] {
  const result: Paragraph[] = []
  for (const it of items) {
    const runs: TextRun[] = []
    if (it.period) runs.push(run(it.period, theme, { bold: true }))
    runs.push(run(`  ·  ${it.role}`, theme, { bold: true }))
    const companyPlace = it.company + (it.place ? ` (${it.place})` : "")
    if (companyPlace) runs.push(run(`, ${companyPlace}`, theme))
    if (it.url) {
      runs.push(
        run(`   ${it.url}`, theme, { size: 9.5, italic: true, color: theme.gray })
      )
    }
    result.push(para(theme, runs, { before: 8, after: 2 }))
    for (const b of it.bullets) {
      result.push(bullet(b, theme))
    }
    if (it.tech) {
      result.push(
        para(
          theme,
          [run(`${techLabel}: ${it.tech}`, theme, { size: 9.5, italic: true, color: theme.gray })],
          { after: 2, leftIndentPt: 18 }
        )
      )
    }
  }
  return result
}

function renderProjects(
  items: ProjectItem[],
  techLabel: string,
  theme: Theme
): Paragraph[] {
  const result: Paragraph[] = []
  for (const it of items) {
    const runs: TextRun[] = [run(it.name, theme, { bold: true })]
    if (it.tagline) runs.push(run(` — ${it.tagline}`, theme))
    result.push(para(theme, runs, { before: 8, after: 2 }))
    if (it.desc) result.push(para(theme, [run(it.desc, theme)], { after: 2 }))
    for (const b of it.bullets) {
      result.push(bullet(b, theme))
    }
    if (it.tech) {
      result.push(
        para(
          theme,
          [run(`${techLabel}: ${it.tech}`, theme, { size: 9.5, italic: true, color: theme.gray })],
          { after: 2, leftIndentPt: 18 }
        )
      )
    }
  }
  return result
}

export async function buildDocx(
  cv: AdaptedCv,
  options: BuildDocxOptions = {}
): Promise<Buffer> {
  const template = cvTemplateById(options.template)
  const accent = options.accentColor?.replace(/^#/, "")
  const theme: Theme = options.theme
    ? { ...options.theme, accent: accent ?? options.theme.accent }
    : {
        font: template.font,
        accent: accent ?? template.accent,
        body: template.body,
        gray: template.gray,
        heading: template.heading,
        accentRule: template.accentRule,
      }

  const techLabel = cv.lang === "en" ? "Technologies" : "Технологии"

  const children: Paragraph[] = []

  if (cv.name) {
    children.push(
      textPara(cv.name, theme, { size: 20, bold: true, color: theme.accent, after: 2 })
    )
  }
  if (cv.title_line) {
    children.push(textPara(cv.title_line, theme, { size: 12, bold: true, after: 2 }))
  }
  if (cv.header_note) {
    children.push(
      textPara(cv.header_note, theme, { size: 10.5, italic: true, color: theme.gray, after: 4 })
    )
  }

  if (cv.contacts.length > 0) {
    const runs: TextRun[] = []
    cv.contacts.forEach((c, i) => {
      runs.push(run(c, theme, { size: 10 }))
      if (i < cv.contacts.length - 1) {
        runs.push(run("   |   ", theme, { size: 10, color: theme.gray }))
      }
    })
    children.push(para(theme, runs, { after: 6 }))
  }

  if (theme.accentRule) {
    children.push(accentRule(theme))
  }

  for (const sec of cv.sections) {
    if (sec.heading) children.push(heading(sec.heading, theme))
    switch (sec.type) {
      case "paragraph":
        for (const line of sec.lines) children.push(textPara(line, theme))
        break
      case "bullets":
        for (const item of sec.items) children.push(bullet(item, theme))
        break
      case "experience":
        children.push(...renderExperience(sec.items, techLabel, theme))
        break
      case "projects":
        children.push(...renderProjects(sec.items, techLabel, theme))
        break
    }
  }

  const doc = new Document({
    creator: "CV Generator",
    styles: {
      default: {
        document: { run: { font: theme.font, size: half(10.5), color: theme.body } },
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
