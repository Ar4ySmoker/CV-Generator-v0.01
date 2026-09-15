import mongoose, { Schema, type Model } from "mongoose"

export interface ApiKeyDoc {
  _id: mongoose.Types.ObjectId
  userId: string
  provider: string
  label: string
  baseUrl: string
  modelName: string
  apiKeyEnc: string
  keyHint: string
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

const ApiKeySchema = new Schema<ApiKeyDoc>(
  {
    userId: { type: String, required: true, index: true },
    provider: { type: String, required: true },
    label: { type: String, default: "" },
    baseUrl: { type: String, required: true },
    modelName: { type: String, required: true },
    apiKeyEnc: { type: String, required: true },
    keyHint: { type: String, default: "" },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
)

export const ApiKey: Model<ApiKeyDoc> =
  (mongoose.models.ApiKey as Model<ApiKeyDoc>) ??
  mongoose.model<ApiKeyDoc>("ApiKey", ApiKeySchema)
