import mongoose, { Schema, type Model } from "mongoose"

export interface TeamDoc {
  _id: mongoose.Types.ObjectId
  name: string
  ownerId: string
  inviteCode: string
  memberIds: string[]
  createdAt: Date
  updatedAt: Date
}

const TeamSchema = new Schema<TeamDoc>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    ownerId: { type: String, required: true, index: true },
    inviteCode: { type: String, required: true, unique: true },
    memberIds: { type: [String], default: [] },
  },
  { timestamps: true }
)

TeamSchema.index({ memberIds: 1 })

export const Team: Model<TeamDoc> =
  (mongoose.models.Team as Model<TeamDoc>) ??
  mongoose.model<TeamDoc>("Team", TeamSchema)
