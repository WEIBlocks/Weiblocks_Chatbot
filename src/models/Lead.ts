import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILead extends Document {
  sessionId: string;
  name: string;
  email: string;
  phone?: string;
  projectType: string;
  budget?: string;
  message?: string;
  conversationId?: mongoose.Types.ObjectId;
  status: 'new' | 'contacted' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema = new Schema<ILead>(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    projectType: { type: String, default: 'General' },
    budget: { type: String },
    message: { type: String },
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation' },
    status: {
      type: String,
      enum: ['new', 'contacted', 'closed'],
      default: 'new',
    },
  },
  { timestamps: true }
);

const Lead: Model<ILead> =
  mongoose.models.Lead || mongoose.model<ILead>('Lead', LeadSchema);

export default Lead;
