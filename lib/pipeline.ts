import { connectDb } from "./db"
import {
  PipelineStage,
  type StageType,
  type TerminalResult,
} from "./models/pipeline-stage"

export interface DefaultStage {
  name: string
  type: StageType
  terminalResult?: TerminalResult
  color: string
}

export const DEFAULT_STAGES: DefaultStage[] = [
  { name: "Черновик", type: "start", color: "#94a3b8" },
  { name: "Отправлено", type: "active", color: "#3b82f6" },
  { name: "Ответ (HR)", type: "active", color: "#8b5cf6" },
  { name: "Собеседование", type: "active", color: "#0ea5e9" },
  { name: "Тех. собеседование", type: "active", color: "#6366f1" },
  { name: "Тестовое задание", type: "active", color: "#f59e0b" },
  { name: "Финальное интервью", type: "active", color: "#14b8a6" },
  { name: "Офер", type: "active", color: "#22c55e" },
  {
    name: "Принято",
    type: "terminal",
    terminalResult: "accepted",
    color: "#16a34a",
  },
  {
    name: "Отклонено",
    type: "terminal",
    terminalResult: "rejected",
    color: "#ef4444",
  },
  {
    name: "Нет ответа",
    type: "terminal",
    terminalResult: "no-response",
    color: "#9ca3af",
  },
]

export async function ensureDefaultStages(userId: string): Promise<void> {
  await connectDb()
  const count = await PipelineStage.countDocuments({ userId })
  if (count > 0) {
    return
  }
  await PipelineStage.insertMany(
    DEFAULT_STAGES.map((s, i) => ({
      userId,
      name: s.name,
      type: s.type,
      terminalResult: s.terminalResult,
      color: s.color,
      order: i,
    }))
  )
}

export async function listStages(userId: string) {
  await ensureDefaultStages(userId)
  return PipelineStage.find({ userId }).sort({ order: 1 })
}

export async function startStageId(userId: string): Promise<string> {
  await ensureDefaultStages(userId)
  const start = await PipelineStage.findOne({ userId, type: "start" }).sort({
    order: 1,
  })
  if (start) {
    return start._id.toString()
  }
  const first = await PipelineStage.findOne({ userId }).sort({ order: 1 })
  return first ? first._id.toString() : ""
}
