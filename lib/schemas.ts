import { z } from "zod"

export const modeSchema = z.enum([
  "with_experience",
  "junior",
  "generate_experience",
])

export type Mode = z.infer<typeof modeSchema>

export const skillLevelSchema = z.enum([
  "basic",
  "intermediate",
  "advanced",
  "expert",
])

export type SkillLevel = z.infer<typeof skillLevelSchema>

const optionalText = z.string().trim().optional()

export const personalSchema = z.object({
  name: z.string().trim().min(1, "Укажите имя"),
  phone: optionalText,
  email: z
    .string()
    .trim()
    .refine((v) => v === "" || z.string().email().safeParse(v).success, {
      message: "Некорректный email",
    }),
  location: optionalText,
  telegram: optionalText,
  github: optionalText,
  site: optionalText,
})

export const skillSchema = z.object({
  name: z.string().trim().min(1, "Укажите навык").max(80, "Слишком длинно"),
  level: skillLevelSchema,
})

export const experienceSchema = z.object({
  period: z.string().trim().min(1, "Укажите период"),
  role: z.string().trim().min(1, "Укажите должность"),
  company: z.string().trim().min(1, "Укажите компанию"),
  place: optionalText,
  url: optionalText,
  bullets: z
    .array(
      z.object({
        value: z.string().trim().min(1, "Пустой пункт"),
      })
    )
    .min(1, "Добавьте хотя бы одну обязанность"),
})

export const educationSchema = z.object({
  institution: z.string().trim().min(1, "Укажите учебное заведение"),
  faculty: optionalText,
  degree: optionalText,
})

export const projectSchema = z.object({
  name: z.string().trim().min(1, "Укажите название"),
  description: optionalText,
  stack: optionalText,
  achievements: optionalText,
})

export const languageSchema = z.object({
  language: z.string().trim().min(1, "Укажите язык"),
  level: z.string().trim().min(1, "Укажите уровень"),
})

export const vacancySchema = z.object({
  source: z.enum(["text", "url"]),
  text: optionalText,
  url: optionalText,
})

export const cvFormSchema = z.object({
  personal: personalSchema,
  skills: z.array(skillSchema).min(1, "Добавьте хотя бы один навык"),
  experience: z.array(experienceSchema),
  education: z.array(educationSchema),
  projects: z.array(projectSchema),
  languages: z.array(languageSchema),
  vacancy: vacancySchema.optional(),
})

export const generateRequestSchema = cvFormSchema.extend({
  mode: modeSchema,
  disclaimerAccepted: z.boolean().optional(),
  save: z.boolean().optional(),
  applicationId: z.string().optional(),
  profileId: z.string().optional(),
})

export type PersonalValues = z.infer<typeof personalSchema>
export type SkillValues = z.infer<typeof skillSchema>
export type ExperienceValues = z.infer<typeof experienceSchema>
export type EducationValues = z.infer<typeof educationSchema>
export type ProjectValues = z.infer<typeof projectSchema>
export type LanguageValues = z.infer<typeof languageSchema>
export type VacancyValues = z.infer<typeof vacancySchema>
export type CvFormValues = z.infer<typeof cvFormSchema>
export type GenerateRequest = z.infer<typeof generateRequestSchema>
