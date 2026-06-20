const mongoose = require('mongoose');

const promptEmbeddingSchema = new mongoose.Schema({
  tokenId: { type: Number, required: true, unique: true },
  promptText: { type: String, required: true },
  problemStatement: { type: String, default: '' },
  embedding: { type: [Number], required: true },
  overallScore: { type: Number, default: 0 },
  isListed: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('PromptEmbedding', promptEmbeddingSchema);
