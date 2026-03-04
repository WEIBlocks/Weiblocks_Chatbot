import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILead extends Document {
  sessionId: string;
  name: string;
  email: string;
  phone?: string;
  projectType: string;
  budget?: string;
  subject?: string;
  message?: string;
  conversationId?: mongoose.Types.ObjectId;
  chatSummary?: string;
  source: 'form' | 'chat_detected';
  emailSent: boolean;
  status: 'new' | 'contacted' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema = new Schema<ILead>(
  {
    sessionId: { type: String, required: true, index: true },
    name: { type: String },
    email: { type: String, required: true },
    phone: { type: String },
    projectType: { type: String, default: 'General' },
    budget: { type: String },
    subject: { type: String },
    message: { type: String },
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation' },
    chatSummary: { type: String },
    source: { type: String, enum: ['form', 'chat_detected'], default: 'form' },
    emailSent: { type: Boolean, default: false },
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
