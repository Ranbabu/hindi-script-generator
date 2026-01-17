import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());
app.use(express.static("public"));

// --- Permission Code (CORS) Start ---
// यह कोड GitHub Pages को सर्वर से बात करने की इजाजत देता है
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*"); // यहाँ '*' का मतलब कोई भी वेबसाइट इसे इस्तेमाल कर सकती है
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});
// --- Permission Code End ---

const HF_API = "https://router.huggingface.co/v1/chat/completions";

app.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt required" });
    }

    const fullPrompt = `तुम एक बेहतरीन हिंदी कहानीकार हो। 
नीचे दिए गए विषय पर एक 2 मिनट में पढ़ी जाने वाली (लगभग 300-400 शब्द) रोचक हिंदी कहानी लिखो।
ध्यान दें:
1. कहानी में ** या ## या * जैसे किसी भी फॉर्मेटिंग का इस्तेमाल मत करना।
2. पैराग्राफ सादे टेक्स्ट में होने चाहिए।
3. कहानी की भाषा सरल और दिल को छू लेने वाली हो।
4. कहानी पूरी हो।

विषय: ${prompt}`;

    const response = await fetch(HF_API, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.HF_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "Qwen/Qwen2.5-72B-Instruct",
        messages: [{ role: "user", content: fullPrompt }],
        max_tokens: 1000,
        temperature: 0.7,
        top_p: 0.9,
        stream: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HF API failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    let generated = data.choices?.[0]?.message?.content?.trim() || "कहानी जनरेट नहीं हो पाई।";

    // सफाई अभियान
    generated = generated.replace(/<think>[\s\S]*?<\/think>/g, "");
    generated = generated.replace(/\*\*/g, "").replace(/##/g, "").replace(/\*/g, "").trim();

    res.json({ generated_text: generated });

  } catch (err) {
    console.error("Server Error:", err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
