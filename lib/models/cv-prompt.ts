import mongoose, { Schema, type Model } from "mongoose"

export interface CvPromptDoc {
  _id: mongoose.Types.ObjectId
  userId: string
  name: string
  content: string
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

const CvPromptSchema = new Schema<CvPromptDoc>(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    content: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
)

export const CvPrompt: Model<CvPromptDoc> =
  (mongoose.models.CvPrompt as Model<CvPromptDoc>) ??
  mongoose.model<CvPromptDoc>("CvPrompt", CvPromptSchema)
