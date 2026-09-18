import mongoose, { Schema, type Model } from "mongoose"

export interface CvThemeDoc {
  _id: mongoose.Types.ObjectId
  userId: string
  name: string
  font: string
  accent: string
  body: string
  gray: string
  heading: "underline" | "bar" | "plain"
  accentRule: boolean
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

const CvThemeSchema = new Schema<CvThemeDoc>(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    font: { type: String, required: true },
    accent: { type: String, required: true },
    body: { type: String, required: true },
    gray: { type: String, required: true },
    heading: { type: String, enum: ["underline", "bar", "plain"], required: true },
    accentRule: { type: Boolean, default: false },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
)

export const CvTheme: Model<CvThemeDoc> =
  (mongoose.models.CvTheme as Model<CvThemeDoc>) ??
  mongoose.model<CvThemeDoc>("CvTheme", CvThemeSchema)
