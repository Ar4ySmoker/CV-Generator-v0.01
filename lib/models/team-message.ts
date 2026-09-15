import mongoose, { Schema, type Model } from "mongoose"

export interface TeamMessageDoc {
  _id: mongoose.Types.ObjectId
  teamId: string
  companyKey: string
  authorId: string
  text: string
  createdAt: Date
  updatedAt: Date
}

const TeamMessageSchema = new Schema<TeamMessageDoc>(
  {
    teamId: { type: String, required: true, index: true },
    companyKey: { type: String, required: true },
    authorId: { type: String, required: true },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: true }
)

TeamMessageSchema.index({ teamId: 1, companyKey: 1, createdAt: 1 })

export const TeamMessage: Model<TeamMessageDoc> =
  (mongoose.models.TeamMessage as Model<TeamMessageDoc>) ??
  mongoose.model<TeamMessageDoc>("TeamMessage", TeamMessageSchema)
