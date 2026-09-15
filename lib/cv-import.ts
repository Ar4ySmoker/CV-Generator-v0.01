import mammoth from "mammoth"
import { extractText as extractPdfText } from "unpdf"

export type CvFileType = "pdf" | "docx"

export class CvImportError extends Error {}

const MAX_FILE_BYTES = 5 * 1024 * 1024

export function detectFileType(
  filename: string,
  contentType: string
): CvFileType {
  const name = filename.toLowerCase()
  if (name.endsWith(".pdf") || contentType === "application/pdf") {
    return "pdf"
  }
  if (
    name.endsWith(".docx") ||
    contentType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return "docx"
  }
  throw new CvImportError("Поддерживаются только файлы PDF и DOCX")
}

export async function extractText(
  buffer: Buffer,
  type: CvFileType
): Promise<string> {
  if (buffer.byteLength === 0) {
    throw new CvImportError("Файл пустой")
  }
  if (buffer.byteLength > MAX_FILE_BYTES) {
    throw new CvImportError("Файл слишком большой (максимум 5 МБ)")
  }

  if (type === "docx") {
    const result = await mammoth.extractRawText({ buffer })
    return result.value.trim()
  }

  const { text } = await extractPdfText(buffer, { mergePages: true })
  return text.trim()
}
