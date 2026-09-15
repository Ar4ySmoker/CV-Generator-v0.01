"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Building2, ExternalLink, MessageSquare } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

import { salaryRange } from "@/lib/format"

import { FeedbackForm, KIND_LABELS, OutcomeBadge } from "./company-shared"
import type { Vacancy } from "./types"

function VacancyCard({
  vacancy,
  teamId,
  onChanged,
}: {
  vacancy: Vacancy
  teamId: string
  onChanged: () => void
}) {
  const [showForm, setShowForm] = useState(false)
  const detailHref = `/teams/${teamId}/companies/${encodeURIComponent(vacancy.companyKey)}`

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3 space-y-0">
        <Building2 className="size-5 text-primary" />
        <div className="min-w-0">
          <CardTitle className="text-base">
            <Link
              href={detailHref}
              className="hover:text-primary hover:underline"
            >
              {vacancy.company}
            </Link>
          </CardTitle>
        </div>
        <Badge variant="secondary" className="ml-auto">
          {vacancy.applicants.length} отклик(ов)
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          {vacancy.applicants.map((a) => {
            const salary = a.salary
              ? salaryRange(a.salary.min, a.salary.max, a.salary.currency)
              : ""
            const offer = a.offer
              ? `Офер: ${a.offer.salary} ${a.offer.currency ?? ""}`
              : ""
            return (
              <div
                key={a.applicationId}
                className="flex flex-col gap-1 rounded-lg border border-border/60 px-3 py-2"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{a.memberName}</span>
                  {a.role ? (
                    <span className="text-xs text-muted-foreground">
                      {a.role}
                    </span>
                  ) : null}
                  <span className="ml-auto flex flex-wrap items-center gap-1.5">
                    <OutcomeBadge outcome={a.outcome} />
                    <span className="text-xs text-muted-foreground">
                      {a.stage}
                    </span>
                  </span>
                </div>
                {salary || offer || a.notes ? (
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    {salary ? <span>{salary}</span> : null}
                    {offer ? <span className="text-primary">{offer}</span> : null}
                    {a.notes ? <span>{a.notes}</span> : null}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>

        {vacancy.feedback.length > 0 ? (
          <div className="flex flex-col gap-2">
            {vacancy.feedback.map((f) => (
              <div
                key={f.id}
                className="flex flex-col gap-1 rounded-lg bg-muted/30 px-3 py-2"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium">
                    {KIND_LABELS[f.kind]}
                  </span>
                  {f.rating ? (
                    <span className="text-xs text-muted-foreground">
                      Сложность {f.rating}/5
                    </span>
                  ) : null}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {f.authorName}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{f.text}</p>
              </div>
            ))}
          </div>
        ) : null}

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={detailHref}>
              <ExternalLink /> Страница компании
            </Link>
          </Button>
          {showForm ? null : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowForm(true)}
            >
              <MessageSquare /> Оставить отзыв
            </Button>
          )}
        </div>

        {showForm ? (
          <FeedbackForm
            teamId={teamId}
            companyKey={vacancy.companyKey}
            company={vacancy.company}
            onAdded={onChanged}
          />
        ) : null}
      </CardContent>
    </Card>
  )
}

export function VacancyBoard({ teamId }: { teamId: string }) {
  const [vacancies, setVacancies] = useState<Vacancy[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const res = await fetch(`/api/teams/${teamId}/vacancies`)
    if (res.ok) {
      const d = (await res.json()) as { vacancies: Vacancy[] }
      setVacancies(d.vacancies)
    }
    setLoading(false)
  }, [teamId])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (vacancies.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border/60 py-12 text-center">
        <Building2 className="size-8 text-muted-foreground" />
        <p className="max-w-sm text-sm text-muted-foreground">
          Пока нет расшаренных вакансий. В карточке отклика включите
          «Поделиться с командой», и они появятся здесь.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {vacancies.map((v) => (
        <VacancyCard key={v.companyKey} vacancy={v} teamId={teamId} onChanged={load} />
      ))}
    </div>
  )
}
