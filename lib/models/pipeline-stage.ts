import mongoose, { Schema, type Model } from "mongoose"

export type StageType = "start" | "active" | "terminal"
export type TerminalResult = "rejected" | "no-response" | "accepted"

export interface PipelineStageDoc {
  _id: mongoose.Types.ObjectId
  userId: string
  name: string
  order: number
  color: string
  type: StageType
  terminalResult?: TerminalResult
  createdAt: Date
  updatedAt: Date
}

const PipelineStageSchema = new Schema<PipelineStageDoc>(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    order: { type: Number, required: true },
    color: { type: String, default: "#64748b" },
    type: {
      type: String,
      enum: ["start", "active", "terminal"],
      required: true,
    },
    terminalResult: {
      type: String,
      enum: ["rejected", "no-response", "accepted"],
    },
  },
  { timestamps: true }
)

export const PipelineStage: Model<PipelineStageDoc> =
  (mongoose.models.PipelineStage as Model<PipelineStageDoc>) ??
  mongoose.model<PipelineStageDoc>("PipelineStage", PipelineStageSchema)
