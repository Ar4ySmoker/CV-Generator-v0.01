import mongoose, { Schema, type Model } from "mongoose"

export type TeamRole = "owner" | "member" | "mentor" | "reviewer"
export type MembershipStatus = "active" | "invited" | "requested"

export interface TeamMembershipDoc {
  _id: mongoose.Types.ObjectId
  userId: string
  teamId: string
  role: TeamRole
  status: MembershipStatus
  createdAt: Date
  updatedAt: Date
}

const TeamMembershipSchema = new Schema<TeamMembershipDoc>(
  {
    userId: { type: String, required: true },
    teamId: { type: String, required: true },
    role: {
      type: String,
      enum: ["owner", "member", "mentor", "reviewer"],
      default: "member",
    },
    status: {
      type: String,
      enum: ["active", "invited", "requested"],
      default: "active",
    },
  },
  { timestamps: true }
)

TeamMembershipSchema.index({ userId: 1, teamId: 1 }, { unique: true })
TeamMembershipSchema.index({ teamId: 1, status: 1 })

export const TeamMembership: Model<TeamMembershipDoc> =
  (mongoose.models.TeamMembership as Model<TeamMembershipDoc>) ??
  mongoose.model<TeamMembershipDoc>("TeamMembership", TeamMembershipSchema)
