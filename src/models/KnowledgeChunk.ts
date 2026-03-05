import mongoose, { Document, Schema } from 'mongoose';

export interface IKnowledgeChunk extends Document {
  url: string;
  title: string;
  content: string;
  embedding: number[];
  chunkIndex: number;
  syncedAt: Date;
}

const KnowledgeChunkSchema = new Schema<IKnowledgeChunk>({
  url:        { type: String, required: true },
  title:      { type: String, default: '' },
  content:    { type: String, required: true },
  embedding:  { type: [Number], required: true },
  chunkIndex: { type: Number, default: 0 },
  syncedAt:   { type: Date, default: Date.now },
});

// Compound index: one doc per (url + chunkIndex)
KnowledgeChunkSchema.index({ url: 1, chunkIndex: 1 }, { unique: true });

export default mongoose.models.KnowledgeChunk ||
  mongoose.model<IKnowledgeChunk>('KnowledgeChunk', KnowledgeChunkSchema);
