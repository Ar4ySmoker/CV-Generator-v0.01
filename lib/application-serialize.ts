import type { ApplicationDoc } from "./models/application"

export function stageEnteredAt(app: ApplicationDoc): Date | null {
  for (let i = app.timeline.length - 1; i >= 0; i--) {
    if (app.timeline[i].type === "stage_change") {
      return app.timeline[i].at
    }
  }
  return app.createdAt ?? null
}

export function serializeApplication(app: ApplicationDoc) {
  return {
    id: app._id.toString(),
    company: app.company,
    role: app.role,
    companyDomain: app.companyDomain ?? null,
    country: app.country ?? null,
    salaryMin: app.salaryMin ?? null,
    salaryMax: app.salaryMax ?? null,
    currency: app.currency ?? null,
    sourceType: app.sourceType ?? null,
    sourceUrl: app.sourceUrl ?? null,
    vacancyText: app.vacancyText ?? null,
    cvId: app.cvId ?? null,
    coverLetterText: app.coverLetterText ?? null,
    stageId: app.stageId,
    timeline: app.timeline ?? [],
    contactIds: app.contactIds ?? [],
    notes: app.notes ?? null,
    sentChannel: app.sentChannel ?? null,
    sentTo: app.sentTo ?? null,
    sentAt: app.sentAt ?? null,
    offerSalary: app.offerSalary ?? null,
    offerCurrency: app.offerCurrency ?? null,
    offerBenefits: app.offerBenefits ?? null,
    offerRemote: app.offerRemote ?? null,
    visibility: app.visibility ?? "private",
    shareSalary: app.shareSalary ?? false,
    shareNotes: app.shareNotes ?? false,
    archived: app.archived,
    stageEnteredAt: stageEnteredAt(app),
    createdAt: app.createdAt,
    updatedAt: app.updatedAt,
  }
}
