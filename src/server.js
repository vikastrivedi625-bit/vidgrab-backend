import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { z } from "zod";

const app = express();
const PORT = process.env.PORT || 8080;

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "16kb" }));

app.use(rateLimit({
  windowMs: 60 * 1000,
  limit: 30
}));

function detectPlatform(raw) {
  const url = new URL(raw);
  const host = url.hostname.toLowerCase();

  if (host.includes("youtube.com") || host === "youtu.be") {
    return url.pathname.startsWith("/shorts/")
      ? "youtube-shorts"
      : "youtube";
  }

  if (host.includes("instagram.com")) return "instagram";

  if (
    host.includes("facebook.com") ||
    host === "fb.watch"
  ) {
    return "facebook";
  }

  return null;
}

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "vidgrab-backend" });
});

app.post("/api/detect", (req, res) => {
  const schema = z.object({
    url: z.string().url().max(2048)
  });

  const parsed = schema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid URL" });
  }

  let platform;

  try {
    platform = detectPlatform(parsed.data.url);
  } catch {
    return res.status(400).json({ error: "Invalid URL" });
  }

  if (!platform) {
    return res.status(400).json({
      error: "Unsupported platform"
    });
  }

  res.json({
    ok: true,
    platform,
    message: "Platform detected successfully"
  });
});

app.listen(PORT, () => {
  console.log(`VidGrab API listening on ${PORT}`);
});
