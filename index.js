import "dotenv/config";
import express from "express";
import multer from "multer";
import fs from "fs/promises";
import { GoogleGenAI } from "@google/genai";
import sharp from "sharp";
import cleanSVG from "./utils/cleanSVG.js";

const app = express();
const upload = multer();
const ai = new GoogleGenAI({ apikey: process.env.GEMINI_API_KEY });

const GEMINI_MODEL = "gemini-2.5-flash";

app.use(express.json());

const PORT = 3000;
app.listen(PORT, () => console.log(`Server ready on http://localhost:3000`));

// ######################### Text bas chatbot  ###################################
app.post("/generate-text", async (req, res) => {
  const { prompt } = req.body;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });

    const output = response.candidates[0].content.parts[0].text;

    res.status(200).json({ response: output });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

// ######################### IMAGE Analyzer ###################################

app.post("/generate-vision", upload.single("image"), async (req, res) => {
  const prompt = req.body.prompt || "Tolong jelaskan isi gambar ini.";

  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    const imageBase64 = req.file.buffer.toString("base64");

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: req.file.mimetype,
                data: imageBase64,
              },
            },
          ],
        },
      ],
    });

    const output = response.candidates[0].content.parts[0].text;

    res.status(200).json({ response: output });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

// ######################### Document Analyzer  ###################################

app.post("/analyze-document", upload.single("file"), async (req, res) => {
  const prompt = req.body.prompt || "Tolong jelaskan isi dokumen ini.";

  try {
    if (!req.file) {
      return res.status(400).json({ message: "No document uploaded" });
    }

    const docBase64 = req.file.buffer.toString("base64");

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: req.file.mimetype,
                data: docBase64,
              },
            },
          ],
        },
      ],
    });

    const output = response.candidates[0].content.parts[0].text;

    res.status(200).json({ response: output });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

// ######################### Audio analyzer ###################################

app.post("/generate-from-audio", upload.single("audio"), async (req, res) => {
  const prompt =
    req.body.prompt ||
    "Tolong transkrip dan jelaskan isi rekaman audio berikut.";

  try {
    if (!req.file) {
      return res.status(400).json({ message: "No audio uploaded" });
    }

    const base64Audio = req.file.buffer.toString("base64");

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: base64Audio,
                mimeType: req.file.mimetype, // audio/wav, m4a, mp3, dll
              },
            },
          ],
        },
      ],
    });

    const output = response.candidates[0].content.parts[0].text;

    res.status(200).json({
      transcription: output,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
});

// ######################### GENERATE IMAGE ###################################
app.post("/generate-image", async (req, res) => {
  const { prompt } = req.body;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: `Buatkan gambar dalam format SVG saja tanpa penjelasan: ${prompt}`,
    });

    const rawSVG = response.candidates[0].content.parts[0].text;

    const svg = cleanSVG(rawSVG);

    if (!svg) {
      return res.status(500).json({
        message: "SVG tidak ditemukan dalam output AI.",
      });
    }

    const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
    const pngBase64 = pngBuffer.toString("base64");

    res.status(200).json({
      svg,
      png: `data:image/png;base64,${pngBase64}`,
      note: "Generated using Gemini Flash (Free) + SVG-to-PNG conversion",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});
