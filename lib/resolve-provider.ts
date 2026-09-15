import { connectDb } from "./db"
import { decrypt } from "./encryption"
import { ApiKey } from "./models/api-key"
import type { ChatProvider } from "./providers"

const SERVER_FALLBACK: ChatProvider = {
  baseUrl: "https://api.deepseek.com",
  apiKey: "",
  model: "deepseek-chat",
}

export async function resolveProvider(userId?: string): Promise<ChatProvider> {
  if (userId) {
    await connectDb()
    const key = await ApiKey.findOne({ userId, isDefault: true }).sort({
      createdAt: -1,
    })
    if (key) {
      return {
        baseUrl: key.baseUrl,
        apiKey: decrypt(key.apiKeyEnc),
        model: key.modelName,
      }
    }
  }

  const serverKey = process.env.DEEPSEEK_API_KEY
  if (!serverKey) {
    throw new Error(
      "Нет доступного LLM-ключа. Добавьте свой API-ключ в настройках."
    )
  }

  return { ...SERVER_FALLBACK, apiKey: serverKey }
}
