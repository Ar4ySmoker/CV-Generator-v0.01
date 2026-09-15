export type ProviderId = "deepseek" | "openai" | "openrouter" | "custom"

export interface ProviderDefinition {
  id: ProviderId
  name: string
  baseUrl: string
  models: string[]
}

export interface ChatProvider {
  baseUrl: string
  apiKey: string
  model: string
}

export const PROVIDERS: ProviderDefinition[] = [
  {
    id: "deepseek",
    name: "DeepSeek",
    baseUrl: "https://api.deepseek.com",
    models: ["deepseek-chat", "deepseek-reasoner"],
  },
  {
    id: "openai",
    name: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    models: ["gpt-4o", "gpt-4o-mini", "o3-mini"],
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    models: [
      "openai/gpt-4o",
      "anthropic/claude-3.5-sonnet",
      "deepseek/deepseek-chat",
      "google/gemini-2.0-flash",
    ],
  },
  {
    id: "custom",
    name: "Свой endpoint",
    baseUrl: "",
    models: [],
  },
]

export function providerById(id: string): ProviderDefinition | undefined {
  return PROVIDERS.find((p) => p.id === id)
}

export function keyHint(apiKey: string): string {
  const trimmed = apiKey.trim()
  if (trimmed.length <= 4) {
    return "••••"
  }
  return "…" + trimmed.slice(-4)
}
