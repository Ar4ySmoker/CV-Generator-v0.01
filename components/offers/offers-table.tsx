"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Stage {
  id: string
  name: string
  terminalResult: string | null
}

interface App {
  id: string
  company: string
  role: string
  country: string | null
  stageId: string
  offerSalary: number | null
  offerCurrency: string | null
  offerBenefits: string | null
  offerRemote: string | null
}

export function OffersTable() {
  const [stages, setStages] = useState<Stage[]>([])
  const [apps, setApps] = useState<App[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const [stagesRes, appsRes] = await Promise.all([
      fetch("/api/stages"),
      fetch("/api/applications"),
    ])
    if (stagesRes.ok) {
      const d = (await stagesRes.json()) as { stages: Stage[] }
      setStages(d.stages)
    }
    if (appsRes.ok) {
      const d = (await appsRes.json()) as { applications: App[] }
      setApps(d.applications)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return <p className="text-sm text-muted-foreground">Загрузка…</p>
  }

  const stageMap = new Map(stages.map((s) => [s.id, s]))
  const offers = apps
    .filter((a) => {
      const s = stageMap.get(a.stageId)
      return s?.name === "Офер" || s?.terminalResult === "accepted"
    })
    .sort((a, b) => (b.offerSalary ?? 0) - (a.offerSalary ?? 0))

  if (offers.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Оферов пока нет. Переместите отклик на этап «Офер» и укажите ЗП.
      </p>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Сравнение оферов</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="py-2 pr-4 font-medium">Компания</th>
              <th className="py-2 pr-4 font-medium">Должность</th>
              <th className="py-2 pr-4 font-medium">Страна</th>
              <th className="py-2 pr-4 font-medium">ЗП</th>
              <th className="py-2 pr-4 font-medium">Формат</th>
              <th className="py-2 pr-4 font-medium">Бенефиты</th>
            </tr>
          </thead>
          <tbody>
            {offers.map((a) => (
              <tr key={a.id} className="border-b last:border-0">
                <td className="py-2 pr-4">
                  <Link
                    href={`/applications/${a.id}`}
                    className="font-medium hover:underline"
                  >
                    {a.company}
                  </Link>
                </td>
                <td className="py-2 pr-4">{a.role}</td>
                <td className="py-2 pr-4">{a.country ?? "—"}</td>
                <td className="py-2 pr-4 font-medium">
                  {a.offerSalary != null ? (
                    <>
                      {a.offerSalary}{" "}
                      {a.offerCurrency ? (
                        <span className="text-muted-foreground">
                          {a.offerCurrency}
                        </span>
                      ) : null}
                    </>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="py-2 pr-4">{a.offerRemote ?? "—"}</td>
                <td className="py-2 pr-4 text-muted-foreground">
                  {a.offerBenefits ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}
