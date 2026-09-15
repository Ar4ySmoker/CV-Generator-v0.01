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
  companyDomain: optionalStr,
  country: optionalStr,
  salaryMin: optionalNum,
  salaryMax: optionalNum,
  currency: optionalStr,
  sourceType: optionalStr,
  sourceUrl: optionalStr,
  vacancyText: optionalStr,
  notes: optionalStr,
  contactIds: z.array(z.string()).optional(),
})

export const activitySchema = z.object({
  type: z.enum(["sent", "response", "note", "offer"]),
  note: optionalStr,
  at: z.string().optional(),
})

export const applicationUpdateSchema = z.object({
  company: z.string().trim().min(1).optional(),
  role: z.string().trim().min(1).optional(),
  companyDomain: optionalStr,
  country: optionalStr,
  salaryMin: optionalNum,
  salaryMax: optionalNum,
  currency: optionalStr,
  sourceType: optionalStr,
  sourceUrl: optionalStr,
  vacancyText: optionalStr,
  notes: optionalStr,
  contactIds: z.array(z.string()).optional(),
  sentChannel: optionalStr,
  sentTo: optionalStr,
  sentAt: z.string().nullable().optional(),
  stageId: z.string().optional(),
  offerSalary: optionalNum,
  offerCurrency: optionalStr,
  offerBenefits: optionalStr,
  offerRemote: optionalStr,
  archived: z.boolean().optional(),
  activity: activitySchema.optional(),
})

export const contactCreateSchema = z.object({
  name: z.string().trim().min(1, "Укажите имя контакта").max(120),
  email: optionalStr,
  phone: optionalStr,
  linkedin: optionalStr,
  company: optionalStr,
  role: optionalStr,
  notes: optionalStr,
})

export const contactUpdateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  email: optionalStr,
  phone: optionalStr,
  linkedin: optionalStr,
  company: optionalStr,
  role: optionalStr,
  notes: optionalStr,
})

export const interviewCreateSchema = z.object({
  applicationId: z.string().min(1, "Укажите отклик"),
  type: z.enum(["screen", "technical", "final", "assignment", "custom"]),
  scheduledAt: z.string().min(1, "Укажите дату и время"),
  channel: optionalStr,
  note: optionalStr,
})

export const interviewUpdateSchema = z.object({
  type: z.enum(["screen", "technical", "final", "assignment", "custom"]).optional(),
  scheduledAt: z.string().optional(),
  channel: optionalStr,
  note: optionalStr,
  status: z.enum(["scheduled", "done", "cancelled"]).optional(),
})
