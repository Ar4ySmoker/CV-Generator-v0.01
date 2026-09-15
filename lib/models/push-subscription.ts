import mongoose, { Schema, type Model } from "mongoose"

export interface PushSubscriptionDoc {
  _id: mongoose.Types.ObjectId
  userId: string
  endpoint: string
  keys: { p256dh: string; auth: string }
  createdAt: Date
  updatedAt: Date
}

const PushSubscriptionSchema = new Schema<PushSubscriptionDoc>(
  {
    userId: { type: String, required: true, index: true },
    endpoint: { type: String, required: true, unique: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
  },
  { timestamps: true }
)

export const PushSubscription: Model<PushSubscriptionDoc> =
  (mongoose.models.PushSubscription as Model<PushSubscriptionDoc>) ??
  mongoose.model<PushSubscriptionDoc>("PushSubscription", PushSubscriptionSchema)
