
import mongoose from "mongoose";
import Update from "./models/Update.js";
import crypto from "crypto";

const MONGO_URI = "mongodb://127.0.0.1:27017/ota_demo";

async function main() {
  if (process.argv.length < 3) { console.error("Usage: node spoof_signature.js <update_id>"); process.exit(1); }
  const id = process.argv[2];
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const u = await Update.findById(id);
  if (!u) { console.error("Update not found"); process.exit(2); }
  
  const fake = crypto.randomBytes(256);
  u.signature = fake;
  await u.save();
  console.log("Replaced signature for id:", id);
  process.exit(0);
}

main().catch(e=>{ console.error(e); process.exit(3); });
