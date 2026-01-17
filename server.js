import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());
app.use(express.static("public"));

const HF_API = "https://router.huggingface.co/v1/chat/completions";

app.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt required" });
    }

    // बेहतर prompt फॉर्मेट हिंदी कहानी के लिए
    const fullPrompt = `तुम एक बेहतरीन हिंदी कहानीकार हो। 
नीचे दिया आइडिया लेकर ठीक 2 मिनट में पढ़ी जा सकने वाली छोटी, रोचक, मजेदार और पूरी हिंदी कहानी लिखो (250-400 शब्द)। 
कहानी में अच्छी शुरुआत, रोमांचक बीच और संतोषजनक अंत हो। 
भाषा सरल, बोलचाल वाली और आकर्षक रखो। 
कहानी: ${prompt}`;

    const response = await fetch(HF_API, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.HF_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "HuggingFaceTB/SmolLM3-3B", // फ्री मॉडल
        messages: [
          {
            role: "user",
            content: fullPrompt
          }
        ],
        max_tokens: 600,
        temperature: 0.8,
        top_p: 0.9,
        stream: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("HF Error:", response.status, errorText);
      throw new Error(`HF API failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    let generated = data.choices?.[0]?.message?.content?.trim() || "कोई आउटपुट नहीं मिला।";

    // --- यहाँ सुधार किया गया है (Fix added here) ---
    // यह लाइन <think> और </think> के बीच के सारे टेक्स्ट को हटा देगी
    generated = generated.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
    // ---------------------------------------------

    res.json({
      generated_text: generated
    });

  } catch (err) {
    console.error("Server Error:", err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
