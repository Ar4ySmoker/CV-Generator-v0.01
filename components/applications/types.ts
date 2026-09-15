export interface Stage {
  id: string
  name: string
  order: number
  color: string
  type: "start" | "active" | "terminal"
  terminalResult: "rejected" | "no-response" | "accepted" | null
}

export type TimelineEventType =
  | "stage_change"
  | "sent"
  | "response"
  | "interview"
  | "offer"
  | "note"

export interface TimelineEvent {
  at: string
  type: TimelineEventType
  stageName?: string
  stageId?: string
  note?: string
}

export interface ApplicationItem {
  id: string
  company: string
  role: string
  companyDomain: string | null
  country: string | null
  salaryMin: number | null
  salaryMax: number | null
  currency: string | null
  sourceType: string | null
  sourceUrl: string | null
  vacancyText: string | null
  cvId: string | null
  stageId: string
  timeline: TimelineEvent[]
  contactIds: string[]
  notes: string | null
  sentChannel: string | null
  sentTo: string | null
  sentAt: string | null
  offerSalary: number | null
  offerCurrency: string | null
  offerBenefits: string | null
  offerRemote: string | null
  archived: boolean
  stageEnteredAt: string | null
  createdAt: string
  updatedAt: string
}

export type InterviewType =
  | "screen"
  | "technical"
  | "final"
  | "assignment"
  | "custom"

export interface InterviewItem {
  id: string
  applicationId: string
  type: InterviewType
  scheduledAt: string
  channel: string | null
  note: string | null
  status: "scheduled" | "done" | "cancelled"
  company: string | null
  role: string | null
  createdAt: string
  updatedAt: string
}

export const INTERVIEW_LABELS: Record<InterviewType, string> = {
  screen: "Собеседование",
  technical: "Тех. собеседование",
  final: "Финальное интервью",
  assignment: "Тестовое задание",
  custom: "Событие",
}

export interface ContactItem {
  id: string
  name: string
  email: string | null
  phone: string | null
  linkedin: string | null
  company: string | null
  role: string | null
  notes: string | null
  applicationCount: number
  createdAt: string
  updatedAt: string
}
