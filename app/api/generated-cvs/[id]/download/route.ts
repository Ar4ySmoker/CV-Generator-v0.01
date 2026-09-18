import { getUserId } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { buildDocx } from "@/lib/docx"
import type { CvThemeStyle } from "@/lib/cv-templates"
import type { AdaptedCv } from "@/lib/llm"
import { GeneratedCv } from "@/lib/models/generated-cv"
import { CvTheme } from "@/lib/models/cv-theme"

const DOCX_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId()
  if (!userId) {
    return Response.json({ error: "Требуется авторизация" }, { status: 401 })
  }

  const { id } = await params
  await connectDb()

  const doc = await GeneratedCv.findOne({ _id: id, userId })
  if (!doc) {
    return Response.json({ error: "CV не найден" }, { status: 404 })
  }

  let themeStyle: CvThemeStyle | undefined
  if (doc.themeId) {
    const theme = await CvTheme.findOne({ _id: doc.themeId, userId })
    if (theme) {
      themeStyle = {
        font: theme.font,
        accent: theme.accent,
        body: theme.body,
        gray: theme.gray,
        heading: theme.heading,
        accentRule: theme.accentRule,
      }
    }
  }

  const buffer = await buildDocx(doc.adaptedCv as AdaptedCv, {
    template: doc.templateId,
    accentColor: doc.accentColor,
    theme: themeStyle,
  })

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": DOCX_CONTENT_TYPE,
      "Content-Disposition": 'attachment; filename="CV.docx"',
    },
  })
}
