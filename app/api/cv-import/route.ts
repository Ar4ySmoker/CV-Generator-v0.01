import { getUserId } from "@/lib/auth"
import { detectFileType, extractText } from "@/lib/cv-import"
import { connectDb } from "@/lib/db"
import { parseCvFromText } from "@/lib/llm"
import { Application } from "@/lib/models/application"
import { GeneratedCv } from "@/lib/models/generated-cv"
import { resolveProvider } from "@/lib/resolve-provider"

export const runtime = "nodejs"

function jsonError(status: number, message: string) {
  return Response.json({ error: message }, { status })
}

export async function POST(request: Request) {
  const userId = await getUserId()
  if (!userId) {
    return jsonError(401, "Требуется авторизация")
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return jsonError(400, "Некорректный запрос")
  }

  const file = formData.get("file")
  if (!(file instanceof File)) {
    return jsonError(400, "Файл не передан")
  }

  const rawApplicationId = formData.get("applicationId")
  const applicationId =
    typeof rawApplicationId === "string" && rawApplicationId.trim()
      ? rawApplicationId.trim()
      : undefined

  let type
  try {
    type = detectFileType(file.name, file.type)
  } catch (err) {
    return jsonError(
      400,
      err instanceof Error ? err.message : "Некорректный файл"
    )
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  let text: string
  try {
    text = await extractText(buffer, type)
  } catch (err) {
    return jsonError(
      422,
      err instanceof Error ? err.message : "Не удалось прочитать файл"
    )
  }

  if (!text) {
    return jsonError(
      422,
      "Не удалось извлечь текст из файла. Возможно, это скан без текстового слоя."
    )
  }

  try {
    await connectDb()

    if (applicationId) {
      const app = await Application.findOne({ _id: applicationId, userId })
      if (!app) {
        return jsonError(404, "Отклик не найден")
      }
    }

    const provider = await resolveProvider(userId)
    const parsed = await parseCvFromText(text, provider)

    const created = await GeneratedCv.create({
      userId,
      applicationId,
      adaptedCv: parsed.adaptedCv,
      inputSnapshot: parsed.form,
      lang: parsed.adaptedCv.lang,
      source: "import",
    })

    if (applicationId) {
      await Application.updateOne(
        { _id: applicationId, userId },
        { cvId: created._id.toString() }
      )
    }

    return Response.json({
      cv: { id: created._id.toString(), adaptedCv: parsed.adaptedCv },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Неизвестная ошибка"
    return jsonError(502, `Не удалось обработать CV: ${message}`)
  }
}
