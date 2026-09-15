import mongoose, { Schema, type Model } from "mongoose"

export type FeedbackKind = "questions" | "tips" | "general"

export interface VacancyFeedbackDoc {
  _id: mongoose.Types.ObjectId
  teamId: string
  companyKey: string
  authorId: string
  kind: FeedbackKind
  rating?: number
  text: string
  createdAt: Date
  updatedAt: Date
}

const VacancyFeedbackSchema = new Schema<VacancyFeedbackDoc>(
  {
    teamId: { type: String, required: true, index: true },
    companyKey: { type: String, required: true },
    authorId: { type: String, required: true },
    kind: {
      type: String,
      enum: ["questions", "tips", "general"],
      default: "general",
    },
    rating: { type: Number, min: 1, max: 5 },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: true }
)

VacancyFeedbackSchema.index({ teamId: 1, companyKey: 1 })

export const VacancyFeedback: Model<VacancyFeedbackDoc> =
  (mongoose.models.VacancyFeedback as Model<VacancyFeedbackDoc>) ??
  mongoose.model<VacancyFeedbackDoc>("VacancyFeedback", VacancyFeedbackSchema)
