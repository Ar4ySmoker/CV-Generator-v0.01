import mongoose, { Schema, type Model } from "mongoose"

export interface TimelineEvent {
  at: Date
  stageName: string
  note?: string
}

export interface ApplicationDoc {
  _id: mongoose.Types.ObjectId
  userId: string
  company: string
  role: string
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
  notes?: string
  contactName?: string
  contactEmail?: string
  sentChannel?: string
  sentTo?: string
  sentAt?: Date
  respondedAt?: Date
  responseChannel?: string
  nextEventType?: string
  nextEventAt?: Date
  nextEventChannel?: string
  nextEventNote?: string
  offerSalary?: number
  offerCurrency?: string
  offerBenefits?: string
  offerRemote?: string
  archived: boolean
  createdAt: Date
  updatedAt: Date
}

const ApplicationSchema = new Schema<ApplicationDoc>(
  {
    userId: { type: String, required: true, index: true },
    company: { type: String, required: true },
    role: { type: String, required: true },
    country: { type: String },
    salaryMin: { type: Number },
    salaryMax: { type: Number },
    currency: { type: String },
    sourceType: { type: String },
    sourceUrl: { type: String },
    vacancyText: { type: String },
    cvId: { type: String },
    stageId: { type: String, required: true, index: true },
    timeline: {
      type: [
        {
          at: { type: Date, default: Date.now },
          stageName: { type: String },
          note: { type: String },
        },
      ],
      default: [],
    },
    notes: { type: String },
    contactName: { type: String },
    contactEmail: { type: String },
    sentChannel: { type: String },
    sentTo: { type: String },
    sentAt: { type: Date },
    respondedAt: { type: Date },
    responseChannel: { type: String },
    nextEventType: { type: String },
    nextEventAt: { type: Date },
    nextEventChannel: { type: String },
    nextEventNote: { type: String },
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
