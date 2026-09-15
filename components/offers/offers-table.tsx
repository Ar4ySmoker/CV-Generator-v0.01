"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Crown, Handshake } from "lucide-react"

import {
  type ApplicationItem,
  type Stage,
} from "@/components/applications/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

function offerStatus(stage: Stage | undefined): string {
  if (stage?.terminalResult === "accepted") return "Принят"
  if (stage?.terminalResult === "rejected") return "Отклонён"
  return "В ожидании"
}

export function OffersTable() {
  const [stages, setStages] = useState<Stage[]>([])
  const [apps, setApps] = useState<ApplicationItem[]>([])
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
      const d = (await appsRes.json()) as { applications: ApplicationItem[] }
      setApps(d.applications)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  const stageMap = new Map(stages.map((s) => [s.id, s]))
  const offers = apps
    .filter((a) => {
      const s = stageMap.get(a.stageId)
      return s?.name === "Офер" || s?.terminalResult === "accepted" || s?.terminalResult === "rejected"
    })
    .sort((a, b) => (b.offerSalary ?? 0) - (a.offerSalary ?? 0))

  if (offers.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <Handshake className="size-8 text-muted-foreground" />
          <p className="max-w-sm text-sm text-muted-foreground">
            Оферов пока нет. Переместите отклик на этап «Офер» и укажите ЗП,
            чтобы сравнить предложения.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href="/applications">К откликам</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const bestSalary = Math.max(...offers.map((o) => o.offerSalary ?? 0))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Сравнение оферов</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Компания</TableHead>
              <TableHead>Должность</TableHead>
              <TableHead>Страна</TableHead>
              <TableHead>ЗП</TableHead>
              <TableHead>Формат</TableHead>
              <TableHead>Бенефиты</TableHead>
              <TableHead>Статус</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {offers.map((a) => {
              const stage = stageMap.get(a.stageId)
              const isBest =
                (a.offerSalary ?? 0) === bestSalary && bestSalary > 0
              return (
                <TableRow key={a.id} className={isBest ? "bg-primary/5" : undefined}>
                  <TableCell>
                    <Link
                      href={`/applications/${a.id}`}
                      className="font-medium hover:underline"
                    >
                      {a.company}
                    </Link>
                    {isBest ? (
                      <Badge variant="secondary" className="ml-2">
                        <Crown className="size-3" /> Лучший
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell>{a.role}</TableCell>
                  <TableCell>{a.country ?? "—"}</TableCell>
                  <TableCell className="font-medium">
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
                  </TableCell>
                  <TableCell>{a.offerRemote ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {a.offerBenefits ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{offerStatus(stage)}</Badge>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
