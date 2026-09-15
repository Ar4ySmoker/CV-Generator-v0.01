import mongoose, { Schema, type Model } from "mongoose"

import type { AdaptedCv } from "@/lib/llm"
import type { CvFormValues } from "@/lib/schemas"

export interface GeneratedCvDoc {
  _id: mongoose.Types.ObjectId
  userId: string
  applicationId?: string
  profileId?: string
  adaptedCv: AdaptedCv
  inputSnapshot: CvFormValues
  lang: "ru" | "en"
  createdAt: Date
  updatedAt: Date
}

const GeneratedCvSchema = new Schema<GeneratedCvDoc>(
  {
    userId: { type: String, required: true, index: true },
    applicationId: { type: String, index: true },
    profileId: { type: String },
    adaptedCv: { type: Schema.Types.Mixed, required: true },
    inputSnapshot: { type: Schema.Types.Mixed, required: true },
    lang: { type: String, enum: ["ru", "en"], required: true },
  },
  { timestamps: true }
)

export const GeneratedCv: Model<GeneratedCvDoc> =
  (mongoose.models.GeneratedCv as Model<GeneratedCvDoc>) ??
  mongoose.model<GeneratedCvDoc>("GeneratedCv", GeneratedCvSchema)
