export type TeamRole = "owner" | "member" | "mentor" | "reviewer"

export interface TeamInfo {
  id: string
  name: string
  description: string | null
  tags: string[]
  domain: string | null
  visibility: "public" | "private"
  joinMode: "open" | "request"
  inviteCode: string
  createdAt: string
  updatedAt: string
}

export interface MyTeam {
  team: TeamInfo
  role: TeamRole
}

export interface TeamMember {
  id: string
  name: string
  email: string | null
  role: TeamRole
}

export interface DiscoverTeam extends TeamInfo {
  memberCount: number
  myRole: TeamRole | null
}

export interface TeamRequest {
  id: string
  userId: string
  name: string
  email: string | null
  role: TeamRole
  createdAt: string
}

export interface UserSearchResult {
  id: string
  name: string
  email: string | null
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

export interface ApplicantTimelineEvent {
  at: string
  type: string
  stageName: string | null
  note: string | null
}

export interface CompanyApplicant {
  applicationId: string
  memberId: string
  memberName: string
  memberEmail: string | null
  role: string
  stage: string
  outcome: Outcome
  timeline: ApplicantTimelineEvent[]
  salary: { min: number | null; max: number | null; currency: string | null } | null
  offer: { salary: number; currency: string | null } | null
  notes: string | null
  updatedAt: string
}

export interface CompanyVacancy {
  sourceType: string | null
  sourceUrl: string | null
  vacancyText: string | null
}

export interface CompanyDetail {
  company: string
  companyKey: string
  vacancy: CompanyVacancy | null
  applicants: CompanyApplicant[]
  feedback: VacancyFeedback[]
}

export interface TeamMessageItem {
  id: string
  authorId: string
  authorName: string
  text: string
  createdAt: string
}
