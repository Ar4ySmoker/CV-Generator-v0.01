import { NextResponse } from "next/server"
import { z } from "zod"

import { getUserId } from "@/lib/auth"
import { connectDb } from "@/lib/db"
import { Application } from "@/lib/models/application"
import { PipelineStage } from "@/lib/models/pipeline-stage"
import { listStages } from "@/lib/pipeline"

const stageUpdateSchema = z.object({
  stages: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string().trim().min(1, "Укажите название").max(120),
        color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Некорректный цвет"),
        type: z.enum(["start", "active", "terminal"]),
        terminalResult: z
          .enum(["rejected", "no-response", "accepted"])
          .nullable()
          .optional(),
      })
    )
    .min(1),
})

function serialize(s: {
  _id: { toString(): string }
  name: string
  order: number
  color: string
  type: string
  terminalResult?: string | null
}) {
  return {
    id: s._id.toString(),
    name: s.name,
    order: s.order,
    color: s.color,
    type: s.type,
    terminalResult: s.terminalResult ?? null,
  }
}

export async function GET() {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 })
  }

  const stages = await listStages(userId)
  return NextResponse.json({ stages: stages.map(serialize) })
}

export async function PUT(request: Request) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Некорректное тело запроса" }, { status: 400 })
  }

  const parsed = stageUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Некорректные данные" },
      { status: 400 }
    )
  }

  const incoming = parsed.data.stages
  if (!incoming.some((s) => s.type === "start")) {
    return NextResponse.json(
      { error: "Должен быть хотя бы один этап типа «Старт»" },
      { status: 400 }
    )
  }

  await connectDb()

  const existing = await PipelineStage.find({ userId })
  const existingMap = new Map(existing.map((s) => [s._id.toString(), s]))

  const keptIds: string[] = []
  for (let i = 0; i < incoming.length; i++) {
    const s = incoming[i]
    const terminalResult =
      s.type === "terminal" ? (s.terminalResult ?? undefined) : undefined

    if (s.id && existingMap.has(s.id)) {
      const doc = existingMap.get(s.id)!
      doc.name = s.name
      doc.color = s.color
      doc.type = s.type
      doc.order = i
      doc.set("terminalResult", terminalResult)
      await doc.save()
      keptIds.push(s.id)
    } else {
      const created = await PipelineStage.create({
        userId,
        name: s.name,
        color: s.color,
        type: s.type,
        terminalResult,
        order: i,
      })
      keptIds.push(created._id.toString())
    }
  }

  const toDelete = existing.filter((s) => !keptIds.includes(s._id.toString()))
  if (toDelete.length > 0) {
    const start = await PipelineStage.findOne({ userId, type: "start" }).sort({
      order: 1,
    })
    for (const d of toDelete) {
      if (start) {
        await Application.updateMany(
          { userId, stageId: d._id.toString() },
          { stageId: start._id.toString() }
        )
      }
      await d.deleteOne()
    }
  }

  const stages = await PipelineStage.find({ userId }).sort({ order: 1 })
  return NextResponse.json({ stages: stages.map(serialize) })
}
