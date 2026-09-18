import { generateRequestSchema } from "@/lib/schemas"
import { generateCv } from "@/lib/llm"
import { buildDocx } from "@/lib/docx"
import type { CvThemeStyle } from "@/lib/cv-templates"
import { fetchVacancyText, VacancyUrlError } from "@/lib/vacancy"
import { auth } from "@/lib/auth"
import { resolveProvider } from "@/lib/resolve-provider"
import { connectDb } from "@/lib/db"
import { GeneratedCv } from "@/lib/models/generated-cv"
import { Application } from "@/lib/models/application"
import { CvTheme } from "@/lib/models/cv-theme"

export const runtime = "nodejs"

const DOCX_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

function jsonError(status: number, message: string) {
  return Response.json({ error: message }, { status })
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonError(400, "Некорректное тело запроса")
  }

  const parsed = generateRequestSchema.safeParse(body)
  if (!parsed.success) {
    return jsonError(
      400,
      parsed.error.issues[0]?.message ?? "Некорректные данные формы"
    )
  }

  const input = parsed.data

  if (input.mode === "generate_experience" && !input.disclaimerAccepted) {
    return jsonError(400, "Подтвердите дисклеймер перед генерацией опыта")
  }

  if (input.vacancy?.source === "url" && input.vacancy.url) {
    try {
      const text = await fetchVacancyText(input.vacancy.url)
      input.vacancy = { source: "text", text }
    } catch (err) {
      if (err instanceof VacancyUrlError) {
        return jsonError(422, err.message)
      }
      return jsonError(422, "Не удалось загрузить вакансию по ссылке")
    }
  }

  try {
    const session = await auth()
    const provider = await resolveProvider(session?.user?.id)
    const cv = await generateCv(input, provider)

    let themeStyle: CvThemeStyle | undefined
    if (input.themeId && session?.user?.id) {
      await connectDb()
      const theme = await CvTheme.findOne({
        _id: input.themeId,
        userId: session.user.id,
      })
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

    if (session?.user?.id && input.save) {
      await connectDb()
      const created = await GeneratedCv.create({
        userId: session.user.id,
        applicationId: input.applicationId,
        profileId: input.profileId,
        adaptedCv: cv,
        inputSnapshot: input,
        lang: cv.lang,
        source: "generated",
        templateId: input.templateId,
        accentColor: input.accentColor,
        themeId: input.themeId,
      })
      if (input.applicationId) {
        await Application.updateOne(
          { _id: input.applicationId, userId: session.user.id },
          { cvId: created._id.toString() }
        )
      }
    }

    const buffer = await buildDocx(cv, {
      template: input.templateId,
      accentColor: input.accentColor,
      theme: themeStyle,
    })
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": DOCX_CONTENT_TYPE,
        "Content-Disposition": 'attachment; filename="CV.docx"',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Неизвестная ошибка"
    return jsonError(502, `Не удалось сгенерировать CV: ${message}`)
  }
}
