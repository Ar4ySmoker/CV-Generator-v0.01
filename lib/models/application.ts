import mongoose, { Schema, type Model } from "mongoose"

export type TimelineEventType =
  | "stage_change"
  | "sent"
  | "response"
  | "interview"
  | "offer"
  | "note"

export interface TimelineEvent {
  at: Date
  type: TimelineEventType
  stageName?: string
  stageId?: string
  note?: string
}

export interface ApplicationDoc {
  _id: mongoose.Types.ObjectId
  userId: string
  company: string
  role: string
  companyDomain?: string
  country?: string
  salaryMin?: number
  salaryMax?: number
  currency?: string
  sourceType?: string
  sourceUrl?: string
  vacancyText?: string
  cvId?: string
  stageId: string
  timeline: TimelineEvent[]
  contactIds: string[]
  notes?: string
  sentChannel?: string
  sentTo?: string
  sentAt?: Date
  offerSalary?: number
  offerCurrency?: string
  offerBenefits?: string
  offerRemote?: string
  archived: boolean
  createdAt: Date
  updatedAt: Date
}

const TimelineEventSchema = new Schema<TimelineEvent>(
  {
    at: { type: Date, default: Date.now },
    type: {
      type: String,
      enum: ["stage_change", "sent", "response", "interview", "offer", "note"],
      required: true,
    },
    stageName: { type: String },
    stageId: { type: String },
    note: { type: String },
  },
  { _id: false }
)

const ApplicationSchema = new Schema<ApplicationDoc>(
  {
    userId: { type: String, required: true, index: true },
    company: { type: String, required: true },
    role: { type: String, required: true },
    companyDomain: { type: String },
    country: { type: String },
    salaryMin: { type: Number },
    salaryMax: { type: Number },
    currency: { type: String },
    sourceType: { type: String },
    sourceUrl: { type: String },
    vacancyText: { type: String },
    cvId: { type: String },
    stageId: { type: String, required: true, index: true },
    timeline: { type: [TimelineEventSchema], default: [] },
    contactIds: { type: [String], default: [] },
    notes: { type: String },
    sentChannel: { type: String },
    sentTo: { type: String },
    sentAt: { type: Date },
    offerSalary: { type: Number },
    offerCurrency: { type: String },
    offerBenefits: { type: String },
    offerRemote: { type: String },
    archived: { type: Boolean, default: false },
  },
  { timestamps: true }
)

export const Application: Model<ApplicationDoc> =
  (mongoose.models.Application as Model<ApplicationDoc>) ??
  mongoose.model<ApplicationDoc>("Application", ApplicationSchema)
