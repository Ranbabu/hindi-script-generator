import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());
app.use(express.static("public"));

const HF_API =
  "https://router.huggingface.co/hf-inference/models/google/gemma-2b-it";

app.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    const response = await fetch(HF_API, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.HF_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        inputs: `हिंदी में पूरी कहानी की स्क्रिप्ट लिखो:\n${prompt}`
      })
    });

    const data = await response.json();
    res.json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
