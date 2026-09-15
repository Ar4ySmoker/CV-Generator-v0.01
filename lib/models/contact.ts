import mongoose, { Schema, type Model } from "mongoose"

export interface ContactDoc {
  _id: mongoose.Types.ObjectId
  userId: string
  name: string
  email?: string
  phone?: string
  telegram?: string
  linkedin?: string
  company?: string
  role?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const ContactSchema = new Schema<ContactDoc>(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    telegram: { type: String },
    linkedin: { type: String },
    company: { type: String },
    role: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
)

export const Contact: Model<ContactDoc> =
  (mongoose.models.Contact as Model<ContactDoc>) ??
  mongoose.model<ContactDoc>("Contact", ContactSchema)
