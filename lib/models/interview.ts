import mongoose, { Schema, type Model } from "mongoose"

export type InterviewType = "screen" | "technical" | "final" | "assignment" | "custom"
export type InterviewStatus = "scheduled" | "done" | "cancelled"

export interface InterviewDoc {
  _id: mongoose.Types.ObjectId
  userId: string
  applicationId: string
  type: InterviewType
  scheduledAt: Date
  channel?: string
  note?: string
  status: InterviewStatus
  reminderSentAt?: Date
  createdAt: Date
  updatedAt: Date
}

const InterviewSchema = new Schema<InterviewDoc>(
  {
    userId: { type: String, required: true, index: true },
    applicationId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ["screen", "technical", "final", "assignment", "custom"],
      default: "screen",
    },
    scheduledAt: { type: Date, required: true },
    channel: { type: String },
    note: { type: String },
    status: {
      type: String,
      enum: ["scheduled", "done", "cancelled"],
      default: "scheduled",
    },
    reminderSentAt: { type: Date },
  },
  { timestamps: true }
)

export const Interview: Model<InterviewDoc> =
  (mongoose.models.Interview as Model<InterviewDoc>) ??
  mongoose.model<InterviewDoc>("Interview", InterviewSchema)
