import mongoose, { Schema, type Model } from "mongoose"

export interface NotificationSettingsDoc {
  _id: mongoose.Types.ObjectId
  userId: string
  enabled: boolean
  interviewReminders: boolean
  reminderLeadMinutes: number
  createdAt: Date
  updatedAt: Date
}

const NotificationSettingsSchema = new Schema<NotificationSettingsDoc>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    enabled: { type: Boolean, default: true },
    interviewReminders: { type: Boolean, default: true },
    reminderLeadMinutes: { type: Number, default: 60 },
  },
  { timestamps: true }
)

export const NotificationSettings: Model<NotificationSettingsDoc> =
  (mongoose.models.NotificationSettings as Model<NotificationSettingsDoc>) ??
  mongoose.model<NotificationSettingsDoc>(
    "NotificationSettings",
    NotificationSettingsSchema
  )

export const DEFAULT_NOTIFICATION_SETTINGS = {
  enabled: true,
  interviewReminders: true,
  reminderLeadMinutes: 60,
} as const
