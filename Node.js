import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static("public"));

const HF_API =
  "https://api-inference.huggingface.co/models/google/gemma-2b-it";

app.post("/generate", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.json({ error: "Prompt missing" });
  }

  try {
    const response = await fetch(HF_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HF_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        inputs: "हिंदी में पूरी यूट्यूब स्क्रिप्ट लिखिए:\n" + prompt
      })
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log("Server running on port " + PORT)
);
