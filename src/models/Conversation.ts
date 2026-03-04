import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface IConversation extends Document {
  sessionId: string;
  messages: IMessage[];
  intentDetected: boolean;
  projectType: string;
  detectedEmail?: string;
  summary?: string;
  status: 'active' | 'completed';
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const ConversationSchema = new Schema<IConversation>(
  {
    sessionId: { type: String, required: true, index: true },
    messages: [MessageSchema],
    intentDetected: { type: Boolean, default: false },
    projectType: { type: String, default: 'General' },
    detectedEmail: { type: String },
    summary: { type: String },
    status: { type: String, enum: ['active', 'completed'], default: 'active' },
    closedAt: { type: Date },
  },
  { timestamps: true }
);

const Conversation: Model<IConversation> =
  mongoose.models.Conversation ||
  mongoose.model<IConversation>('Conversation', ConversationSchema);

export default Conversation;
