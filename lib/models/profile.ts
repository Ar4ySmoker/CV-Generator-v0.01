import mongoose, { Schema, type Model } from "mongoose"

import type { CvFormValues } from "@/lib/schemas"

export interface ProfileDoc {
  _id: mongoose.Types.ObjectId
  userId: string
  label: string
  data: CvFormValues
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

const ProfileSchema = new Schema<ProfileDoc>(
  {
    userId: { type: String, required: true, index: true },
    label: { type: String, required: true },
    data: { type: Schema.Types.Mixed, required: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
)

export const Profile: Model<ProfileDoc> =
  (mongoose.models.Profile as Model<ProfileDoc>) ??
  mongoose.model<ProfileDoc>("Profile", ProfileSchema)
