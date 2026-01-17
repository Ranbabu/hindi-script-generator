import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());
app.use(express.static("public"));

const HF_API = "https://router.huggingface.co/v1/chat/completions";

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
        model: "google/gemma-2b-it",
        messages: [
          {
            role: "user",
            content: `हिंदी में 2 मिनट की कहानी की स्क्रिप्ट लिखो:\n${prompt}`
          }
        ],
        max_tokens: 500
      })
    });

    const data = await response.json();

    // clean response for frontend
    res.json({
      generated_text: data.choices?.[0]?.message?.content || "No output"
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
