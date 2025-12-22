// models/Update.js
import mongoose from "mongoose";
const { Schema } = mongoose;

const UpdateSchema = new Schema({
  filename: String,
  version: String,
  sha256: String,
  signature: Buffer,
  firmware: Buffer,
  manifest_json: String,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Update", UpdateSchema);
