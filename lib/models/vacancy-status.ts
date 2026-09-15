import mongoose, { Schema, type Model } from "mongoose"

export type VacancyStatusValue = "saved" | "applied" | "skipped"

export interface VacancyStatusDoc {
  _id: mongoose.Types.ObjectId
  userId: string
  vacancyId: string
  status: VacancyStatusValue
  applicationId?: string
  createdAt: Date
  updatedAt: Date
}

const VacancyStatusSchema = new Schema<VacancyStatusDoc>(
  {
    userId: { type: String, required: true, index: true },
    vacancyId: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ["saved", "applied", "skipped"],
      default: "saved",
    },
    applicationId: { type: String },
  },
  { timestamps: true }
)

VacancyStatusSchema.index({ userId: 1, vacancyId: 1 }, { unique: true })

export const VacancyStatus: Model<VacancyStatusDoc> =
  (mongoose.models.VacancyStatus as Model<VacancyStatusDoc>) ??
  mongoose.model<VacancyStatusDoc>("VacancyStatus", VacancyStatusSchema)
