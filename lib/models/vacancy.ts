import mongoose, { Schema, type Model } from "mongoose"

export type VacancySource = "manual" | "shared"

export interface VacancyDoc {
  _id: mongoose.Types.ObjectId
  company: string
  role: string
  country?: string
  salaryMin?: number
  salaryMax?: number
  currency?: string
  sourceUrl?: string
  sourceType?: string
  description?: string
  tags?: string[]
  source: VacancySource
  teamId?: string
  sharedById?: string
  createdById: string
  createdAt: Date
  updatedAt: Date
}

const VacancySchema = new Schema<VacancyDoc>(
  {
    company: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    country: { type: String },
    salaryMin: { type: Number },
    salaryMax: { type: Number },
    currency: { type: String },
    sourceUrl: { type: String },
    sourceType: { type: String },
    description: { type: String },
    tags: { type: [String], default: [] },
    source: { type: String, enum: ["manual", "shared"], default: "manual" },
    teamId: { type: String },
    sharedById: { type: String },
    createdById: { type: String, required: true, index: true },
  },
  { timestamps: true }
)

VacancySchema.index({ company: 1, role: 1 })

export const Vacancy: Model<VacancyDoc> =
  (mongoose.models.Vacancy as Model<VacancyDoc>) ??
  mongoose.model<VacancyDoc>("Vacancy", VacancySchema)
