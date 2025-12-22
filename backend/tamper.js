// tamper.js
import mongoose from "mongoose";
import Update from "./models/Update.js";

const MONGO_URI = "mongodb://127.0.0.1:27017/ota_demo";

async function main() {
  if (process.argv.length < 3) {
    console.error("Usage: node tamper.js <update_id>");
    process.exit(1);
  }
  const id = process.argv[2];
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const u = await Update.findById(id);
  if (!u) { console.error("Update not found"); process.exit(2); }
  
  u.firmware = Buffer.from("MALICIOUS_PAYLOAD_" + Date.now());
  await u.save();
  console.log("Tampered firmware for id:", id);
  process.exit(0);
}

main().catch(e=>{ console.error(e); process.exit(3); });
