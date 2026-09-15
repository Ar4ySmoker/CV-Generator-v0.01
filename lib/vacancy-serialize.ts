import type { VacancyDoc } from "./models/vacancy"

export function serializeVacancy(v: VacancyDoc) {
  return {
    id: v._id.toString(),
    company: v.company,
    role: v.role,
    country: v.country ?? null,
    salaryMin: v.salaryMin ?? null,
    salaryMax: v.salaryMax ?? null,
    currency: v.currency ?? null,
    sourceUrl: v.sourceUrl ?? null,
    sourceType: v.sourceType ?? null,
    description: v.description ?? null,
    tags: v.tags ?? [],
    source: v.source ?? "manual",
    teamId: v.teamId ?? null,
    sharedById: v.sharedById ?? null,
    createdById: v.createdById,
    createdAt: v.createdAt,
    updatedAt: v.updatedAt,
  }
}

export type SerializedVacancy = ReturnType<typeof serializeVacancy>
