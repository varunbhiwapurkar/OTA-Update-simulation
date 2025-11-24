// server.js
import express from "express";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import https from "https";
import cors from "cors";
import multer from "multer";
import crypto from "crypto";
import Update from "./models/Update.js";

const __dirname = path.resolve();
const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URI = "mongodb://127.0.0.1:27017/ota_demo";
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(()=>console.log("[mongo] connected"))
  .catch(err=>console.error(err));

const PRIVATE_KEY_PATH = path.join(__dirname, "manufacturer_private.pem");
const PUBLIC_KEY_PATH  = path.join(__dirname, "manufacturer_public.pem");

if (!fs.existsSync(PRIVATE_KEY_PATH) || !fs.existsSync(PUBLIC_KEY_PATH)) {
  console.error("Missing keys in backend folder. Place manufacturer_private.pem and manufacturer_public.pem in backend/");
  process.exit(1);
}
const PRIVATE_KEY_PEM = fs.readFileSync(PRIVATE_KEY_PATH, "utf8");
const PUBLIC_KEY_PEM  = fs.readFileSync(PUBLIC_KEY_PATH, "utf8");

const upload = multer({ storage: multer.memoryStorage() });

app.post("/api/upload", upload.single("firmware"), async (req, res) => {
  try {
    const fileBuf = req.file.buffer;
    const filename = req.file.originalname || "firmware.bin";
    const version = req.body.version || "1.0";

    const hash = crypto.createHash("sha256").update(fileBuf).digest("hex");
    const manifest = { filename, version, sha256: hash, timestamp: new Date().toISOString() };
    const manifestJson = JSON.stringify(manifest);

    const sign = crypto.createSign("SHA256");
    sign.update(manifestJson);
    sign.end();

    const signature = sign.sign({
      key: PRIVATE_KEY_PEM,
      padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
      saltLength: 32      // IMPORTANT: use 32 for WebCrypto compatibility
    });

    const upd = new Update({
      filename,
      version,
      sha256: hash,
      signature: signature,
      firmware: fileBuf
    });
    await upd.save();
    return res.json({ ok: true, id: upd._id, manifest });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/updates/latest", async (req, res) => {
  const upd = await Update.findOne().sort({ createdAt: -1 }).lean();
  if (!upd) return res.status(404).json({ error: "no update" });
  res.json({
    id: upd._id,
    manifest: {
      filename: upd.filename,
      version: upd.version,
      sha256: upd.sha256,
      timestamp: upd.createdAt
    },
    signature: upd.signature.toString("base64")
  });
});

app.get("/api/updates/:id/firmware", async (req, res) => {
  try {
    const upd = await Update.findById(req.params.id).lean();
    if (!upd) return res.status(404).send("not found");
    res.setHeader("Content-Disposition", `attachment; filename="${upd.filename}"`);
    res.setHeader("Content-Type", "application/octet-stream");
    res.send(Buffer.from(upd.firmware));
  } catch (err) {
    res.status(500).send("err");
  }
});

app.get("/api/keys/public", (req, res) => {
  res.type("application/x-pem-file").send(PUBLIC_KEY_PEM);
});

const PORT = 8443;
const CERT_PATH = path.join(__dirname, "server.crt");
const KEY_PATH  = path.join(__dirname, "server.key");
if (!fs.existsSync(CERT_PATH) || !fs.existsSync(KEY_PATH)) {
  console.error("Missing server.crt / server.key in backend folder for HTTPS");
  process.exit(1);
}
const options = { key: fs.readFileSync(KEY_PATH), cert: fs.readFileSync(CERT_PATH) };

https.createServer(options, app).listen(PORT, ()=> {
  console.log(`[ota-server] running https://localhost:${PORT}`);
});
