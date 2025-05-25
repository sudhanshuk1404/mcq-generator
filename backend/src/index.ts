import express from "express";
import multer from "multer";
import cors from "cors";
import axios from "axios";
import fs from "fs";
import path from "path";
import FormData from "form-data";
import { Request, Response, NextFunction } from "express";
import { verifyFirebaseToken } from "./auth-middleware";
import { connectToMongo, videosCollection } from "./mongo";
import { ObjectId } from "mongodb";
import { mcqsCollection } from "./mongo";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json()); // If any JSON body is needed

// 📁 File storage config
const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    const uploadPath = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename: function (_req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// ✂️ Word-based segmenting
function segmentTranscriptByWords(
  fullText: string,
  wordsPerSegment: number = 750
): string[] {
  const words = fullText.trim().split(/\s+/);
  const segments: string[] = [];

  for (let i = 0; i < words.length; i += wordsPerSegment) {
    const chunk = words.slice(i, i + wordsPerSegment).join(" ");
    segments.push(chunk);
  }

  return segments;
}

function generateMockMCQ(segment: string) {
  return {
    question: `What is the topic of: "${segment.slice(0, 30)}..."?`,
    options: ["Option A", "Option B", "Option C", "Option D"],
    answer: "Option A",
  };
}

async function generateMCQFromLLM(segment: string) {
  const prompt = `
You are an AI educator assistant.

TASK:
From the paragraph below, generate multiple-choice questions (MCQs) that test comprehension of different ideas in the text.

- Generate 2 to 5 MCQs that together cover different parts or ideas of the paragraph.
- For each MCQ:
  - Provide 1 clear question.
  - Provide 4 answer options labeled A to D.
  - Mark the correct option clearly.
- Use simple and relevant language suitable for learners.
- Do NOT repeat exact lines from the paragraph.
- Avoid duplicate or overly similar questions.

Respond ONLY in JSON format like this:

{{
  "mcqs": [
    {{
      "question": "...",
      "options": ["A", "B", "C", "D"],
      "answer": "..."
    }}
  ]
}}

PARAGRAPH:
"${segment}"
  `.trim();

  try {
    const res = await axios.post("http://localhost:8000/generate-mcq", {
      prompt,
    });

    return res.data.mcqs;
  } catch (err: any) {
    console.error("❌ Failed to generate MCQ:", err.message);
    return {
      question: "Failed to generate MCQ",
      options: ["N/A", "N/A", "N/A", "N/A"],
      answer: "N/A",
    };
  }
}
// 📤 Main Upload + Transcribe Endpoint
app.post(
  "/api/upload",
  (req, res, next) => {
    console.log("📥 Incoming POST /api/upload");
    next();
  },
  verifyFirebaseToken, // log inside this
  upload.single("file"), // log inside multer callback
  async (req: Request, res: Response): Promise<void> => {
    console.log("🧩 Hit final upload handler");
    console.log("🔓 Auth verified + file middleware passed");

    if (!req.file) {
      console.log("❌ No file received");
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const filename = req.file.filename;
    const filePath = path.join(__dirname, "../uploads", filename);

    console.log("📂 File saved:", filename);
    console.log("🧠 Preparing to call Python Whisper service...");

    try {
      const form = new FormData();
      form.append("file", fs.createReadStream(filePath), filename);

      const whisperResponse = await axios.post(
        "http://localhost:8000/transcribe",
        form,
        {
          headers: form.getHeaders(),
        }
      );

      const { text } = whisperResponse.data;
      console.log("📝 Transcription returned");

      if (!text || typeof text !== "string") {
        console.error("❌ Whisper returned no valid text");
        res.status(500).json({ error: "Invalid transcript received" });
        return;
      }

      const transcriptSegments = segmentTranscriptByWords(text, 750);
      console.log(
        "✅ Transcript segmented into",
        transcriptSegments.length,
        "chunks"
      );

      // res.status(200).json({
      //   message: "Upload and transcription successful",
      //   fullTranscript: text,
      //   segments: transcriptSegments,
      // });
      await videosCollection.insertOne({
        uid: (req as any).user?.uid || null,
        email: (req as any).user?.email || null,
        filename,
        uploadedAt: new Date(),
        fullTranscript: text,
        segments: transcriptSegments,
      });
      const videoDoc = await videosCollection.insertOne({
        uid: (req as any).user?.uid || null,
        email: (req as any).user?.email || null,
        filename,
        uploadedAt: new Date(),
        fullTranscript: text,
        segments: transcriptSegments,
      });

      // Generate and insert MCQs per segment
      const videoId = videoDoc.insertedId;

      // Replace old `map()` logic with:
      const mcqs: any[] = [];

      for (let index = 0; index < transcriptSegments.length; index++) {
        const segment = transcriptSegments[index];
        const generated = await generateMCQFromLLM(segment);

        if (Array.isArray(generated)) {
          for (const item of generated) {
            mcqs.push({
              uid: (req as any).user?.uid,
              videoId,
              segmentIndex: index,
              ...item,
            });
          }
        } else {
          console.warn(
            `⚠️ Skipping segment ${index}, LLM response invalid`,
            generated
          );
        }
      }

      await mcqsCollection.insertMany(mcqs);

      console.log(`🧠 Stored ${mcqs.length} MCQs for video ${videoId}`);
      res.status(200).json({
        message: "Upload and transcription successful",
        videoId: videoId.toString(),
        fullTranscript: text,
        segments: transcriptSegments,
      });
    } catch (error: any) {
      console.error("❌ Transcription error:", error.message);
      res.status(500).json({ error: "Failed to transcribe video" });
    }
  }
);
app.get(
  "/api/videos/:id",
  async (
    req: Request<{ id: string }, any, any, any>,
    res: Response
  ): Promise<void> => {
    const video = await videosCollection.findOne({
      _id: new ObjectId(req.params.id),
    });

    if (!video) {
      res.status(404).json({ error: "Video not found" });
      return;
    }

    res.json({
      segments: video.segments,
      fullTranscript: video.fullTranscript,
    });
  }
);

app.get(
  "/api/mcqs/:videoId",
  async (
    req: Request<{ videoId: string }, any, any, any>,
    res: Response
  ): Promise<void> => {
    const mcqs = await mcqsCollection
      .find({ videoId: new ObjectId(req.params.videoId) })
      .toArray();

    res.json({ mcqs });
  }
);
app.patch("/api/mcqs/:id", async (req, res) => {
  const { id } = req.params;
  const { question, options, answer } = req.body;

  try {
    const result = await mcqsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { question, options, answer } }
    );

    if (result.modifiedCount === 1) {
      res.json({ message: "MCQ updated" });
    } else {
      res.status(404).json({ error: "MCQ not found or no change" });
    }
  } catch (err) {
    console.error("❌ Update error:", err);
    res.status(500).json({ error: "Failed to update MCQ" });
  }
});

// ✅ use this instead:
app.use((req: Request, res: Response) => {
  console.warn("⚠️ Route not found:", req.method, req.originalUrl);
  res.status(404).json({ error: "Route not found" });
});

// 🚀 Start server
connectToMongo();

app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
