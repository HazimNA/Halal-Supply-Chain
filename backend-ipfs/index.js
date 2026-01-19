import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import axios from "axios";
import FormData from "form-data";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5050;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";
const PINATA_JWT = process.env.PINATA_JWT;

if (!PINATA_JWT) {
  console.error("❌ Missing PINATA_JWT in .env");
}

// ✅ CORS so your React app can call this backend
app.use(
  cors({
    origin: CORS_ORIGIN,
    methods: ["GET", "POST"],
  })
);

app.get("/health", (_req, res) => {
  res.json({ ok: true, message: "IPFS backend running" });
});

// ✅ upload using memoryStorage (no file saved on disk)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB (adjust if needed)
  },
});

// POST /api/ipfs/upload
app.post("/api/ipfs/upload", upload.single("file"), async (req, res) => {
  try {
    if (!PINATA_JWT) {
      return res.status(500).json({ error: "Server missing PINATA_JWT" });
    }
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded. Field name must be 'file'." });
    }

    const form = new FormData();
    form.append("file", req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    // Optional: metadata
    form.append(
      "pinataMetadata",
      JSON.stringify({
        name: `HalalCertificate_${Date.now()}_${req.file.originalname}`,
      })
    );

    // Optional: pin options
    form.append(
      "pinataOptions",
      JSON.stringify({
        cidVersion: 1,
      })
    );

    const pinataRes = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      maxBodyLength: Infinity,
    });

    const cid = pinataRes?.data?.IpfsHash;
    if (!cid) {
      return res.status(500).json({ error: "Pinata did not return IpfsHash" });
    }

    return res.json({
      cid,
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });
  } catch (err) {
    const details = err?.response?.data || err?.message || "Upload failed";
    console.error("❌ Pinata upload error:", details);
    return res.status(500).json({ error: "Upload failed", details });
  }
});

app.listen(PORT, () => {
  console.log(`✅ IPFS backend listening on http://localhost:${PORT}`);
  console.log(`✅ CORS origin allowed: ${CORS_ORIGIN}`);
});
