import mongoose, { Schema, type Model } from "mongoose"

export type TeamActivityType = "shared" | "feedback" | "stage"

export interface TeamActivityDoc {
  _id: mongoose.Types.ObjectId
  teamId: string
  type: TeamActivityType
  actorId: string
  applicationId?: string
  company?: string
  role?: string
  stageName?: string
  feedbackKind?: string
  createdAt: Date
  updatedAt: Date
}

const TeamActivitySchema = new Schema<TeamActivityDoc>(
  {
    teamId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ["shared", "feedback", "stage"],
      required: true,
    },
    actorId: { type: String, required: true },
    applicationId: { type: String },
    company: { type: String },
    role: { type: String },
    stageName: { type: String },
    feedbackKind: { type: String },
  },
  { timestamps: true }
)

TeamActivitySchema.index({ teamId: 1, createdAt: -1 })

export const TeamActivity: Model<TeamActivityDoc> =
  (mongoose.models.TeamActivity as Model<TeamActivityDoc>) ??
  mongoose.model<TeamActivityDoc>("TeamActivity", TeamActivitySchema)
