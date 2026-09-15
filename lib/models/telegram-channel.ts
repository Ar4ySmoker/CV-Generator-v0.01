import mongoose, { Schema, type Model } from "mongoose"

export interface TelegramChannelDoc {
  _id: mongoose.Types.ObjectId
  username: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

const TelegramChannelSchema = new Schema<TelegramChannelDoc>(
  {
    username: { type: String, required: true, unique: true, trim: true },
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
)

export const TelegramChannel: Model<TelegramChannelDoc> =
  (mongoose.models.TelegramChannel as Model<TelegramChannelDoc>) ??
  mongoose.model<TelegramChannelDoc>("TelegramChannel", TelegramChannelSchema)
