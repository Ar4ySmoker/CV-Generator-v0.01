import mongoose, { Schema, type Model } from "mongoose"

export interface TeamDoc {
  _id: mongoose.Types.ObjectId
  name: string
  description?: string
  tags?: string[]
  domain?: string
  visibility: "public" | "private"
  joinMode: "open" | "request"
  inviteCode: string
  createdAt: Date
  updatedAt: Date
}

const TeamSchema = new Schema<TeamDoc>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, trim: true, maxlength: 300 },
    tags: { type: [String], default: [] },
    domain: { type: String, trim: true, maxlength: 80 },
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "private",
    },
    joinMode: {
      type: String,
      enum: ["open", "request"],
      default: "request",
    },
    inviteCode: { type: String, required: true, unique: true },
  },
  { timestamps: true }
)

TeamSchema.index({ visibility: 1, domain: 1 })

export const Team: Model<TeamDoc> =
  (mongoose.models.Team as Model<TeamDoc>) ??
  mongoose.model<TeamDoc>("Team", TeamSchema)
