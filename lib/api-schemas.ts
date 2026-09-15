import { z } from "zod"

import { cvFormSchema } from "./schemas"

const optionalNum = z.number().nullable().optional()
const optionalStr = z.string().trim().nullable().optional()

export const profileCreateSchema = z.object({
  label: z.string().trim().min(1, "Укажите название профиля").max(120),
  data: cvFormSchema,
  isDefault: z.boolean().optional(),
})

export const profileUpdateSchema = z.object({
  label: z.string().trim().min(1).max(120).optional(),
  data: cvFormSchema.optional(),
  isDefault: z.boolean().optional(),
})

export const applicationCreateSchema = z.object({
  company: z.string().trim().min(1, "Укажите компанию"),
  role: z.string().trim().min(1, "Укажите должность"),
  country: optionalStr,
  salaryMin: optionalNum,
  salaryMax: optionalNum,
  currency: optionalStr,
  sourceType: optionalStr,
  sourceUrl: optionalStr,
  vacancyText: optionalStr,
  notes: optionalStr,
  contactName: optionalStr,
  contactEmail: optionalStr,
})

export const applicationUpdateSchema = z.object({
  company: z.string().trim().min(1).optional(),
  role: z.string().trim().min(1).optional(),
  country: optionalStr,
  salaryMin: optionalNum,
  salaryMax: optionalNum,
  currency: optionalStr,
  sourceType: optionalStr,
  sourceUrl: optionalStr,
  vacancyText: optionalStr,
  notes: optionalStr,
  contactName: optionalStr,
  contactEmail: optionalStr,
  sentChannel: optionalStr,
  sentTo: optionalStr,
  respondedAt: z.string().nullable().optional(),
  responseChannel: optionalStr,
  nextEventType: optionalStr,
  nextEventAt: z.string().nullable().optional(),
  nextEventChannel: optionalStr,
  nextEventNote: optionalStr,
  stageId: z.string().optional(),
  sentAt: z.string().nullable().optional(),
  offerSalary: optionalNum,
  offerCurrency: optionalStr,
  offerBenefits: optionalStr,
  offerRemote: optionalStr,
  archived: z.boolean().optional(),
})
