export interface TeamInfo {
  id: string
  name: string
  ownerId: string
  inviteCode: string
  memberIds: string[]
}

export interface TeamMember {
  id: string
  name: string
  email: string | null
  isOwner: boolean
}

export type Outcome =
  | "in-progress"
  | "offer"
  | "accepted"
  | "rejected"
  | "no-response"

export type FeedbackKind = "questions" | "tips" | "general"

export interface VacancyApplicant {
  applicationId: string
  memberId: string
  memberName: string
  role: string
  stage: string
  outcome: Outcome
  salary: { min: number | null; max: number | null; currency: string | null } | null
  offer: { salary: number; currency: string | null } | null
  notes: string | null
  updatedAt: string
}

export interface VacancyFeedback {
  id: string
  authorId: string
  authorName: string
  kind: FeedbackKind
  rating: number | null
  text: string
  createdAt: string
}

export interface Vacancy {
  companyKey: string
  company: string
  applicants: VacancyApplicant[]
  feedback: VacancyFeedback[]
}
