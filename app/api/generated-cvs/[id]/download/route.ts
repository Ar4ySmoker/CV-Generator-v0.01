import { getUserId } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { buildDocx } from "@/lib/docx"
import type { AdaptedCv } from "@/lib/llm"
import { GeneratedCv } from "@/lib/models/generated-cv"

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

  const buffer = await buildDocx(doc.adaptedCv as AdaptedCv, {
    template: doc.templateId,
    accentColor: doc.accentColor,
  })

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": DOCX_CONTENT_TYPE,
      "Content-Disposition": 'attachment; filename="CV.docx"',
    },
  })
}
