
import mongoose from "mongoose";
import Update from "./models/Update.js";
import fs from "fs";
import crypto from "crypto";

const MONGO_URI = "mongodb://127.0.0.1:27017/ota_demo";
const id = process.argv[2];
if (!id) { console.error("Usage: node inspect_update_fixed.js <id>"); process.exit(1); }

async function main() {
  await mongoose.connect(MONGO_URI);
  const u = await Update.findById(id); 
  if (!u) { console.log("Not found"); process.exit(2); }

  console.log("Found update id:", id);
  console.log("filename:", u.filename);
  console.log("manifest sha:", u.sha256);
  console.log("mongo object type of firmware:", Object.prototype.toString.call(u.firmware));

  
  let buf = null;

  
  if (Buffer.isBuffer(u.firmware)) {
    buf = u.firmware;
    console.log("Detected Node Buffer, length:", buf.length);
  } else if (u.firmware && u.firmware.buffer && u.firmware.buffer instanceof ArrayBuffer) {
    
    buf = Buffer.from(u.firmware.buffer);
    console.log("Detected object with .buffer (ArrayBuffer). length:", buf.length);
  } else if (u.firmware && typeof u.firmware.toString === "function") {
    
    try {
      const b64 = u.firmware.toString("base64"); 
      buf = Buffer.from(b64, "base64");
      console.log("Used toString->base64 fallback. length:", buf.length);
    } catch (e) {
      
      console.log("Cannot convert firmware automatically. firmware inspected keys:", Object.keys(u.firmware || {}));
    }
  } else {
    console.log("Unknown firmware storage shape. Raw value:", u.firmware);
  }

  if (buf && buf.length >= 0) {
    
    const outPath = `extracted_firmware_${id}.bin`;
    fs.writeFileSync(outPath, buf);
    console.log("Wrote firmware to:", outPath, "size(bytes):", buf.length);

    
    const hash = crypto.createHash("sha256").update(buf).digest("hex");
    console.log("Computed SHA256 of stored firmware:", hash);
  } else {
    console.log("Failed to extract firmware buffer from DB record.");
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(3); });
