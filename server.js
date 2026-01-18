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
    // अब हम request से 'prompt' के साथ-साथ 'type' भी ले रहे हैं
    // type बता सकता है कि यह 'quiz' है, 'story' है या 'news'
    const { prompt, type } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt required" });
    }

    let systemInstruction = "";

    // --- Logic to decide the behavior ---
    
    // 1. अगर यूजर को QUIZ चाहिए
    if (type === "quiz" || prompt.toLowerCase().includes("quiz") || prompt.toLowerCase().includes("mcq")) {
      systemInstruction = `तुम एक एग्जाम पेपर सेटर हो।
नीचे दिए गए विषय पर 5 बहुविकल्पीय प्रश्न (Multiple Choice Questions) हिंदी में बनाओ।
हर प्रश्न के बाद 4 विकल्प (A, B, C, D) और सही उत्तर (Correct) होना चाहिए।
फॉर्मेट बिल्कुल ऐसा ही रखो:

Q: [प्रश्न यहाँ]

A) [विकल्प A]
B) [विकल्प B]
C) [विकल्प C]
D) [विकल्प D]

Correct: [सही विकल्प का अक्षर, जैसे A]

विषय: ${prompt}`;
    } 
    
    // 2. अगर यूजर को NEWS SCRIPT चाहिए
    else if (type === "news" || prompt.toLowerCase().includes("news") || prompt.toLowerCase().includes("samachar")) {
      systemInstruction = `तुम एक प्रोफेशनल न्यूज़ एंकर हो। 
नीचे दिए गए विषय पर एक छोटी और दमदार न्यूज़ स्क्रिप्ट (Intro, Body, Outro) हिंदी में लिखो।
भाषा औपचारिक और टीवी न्यूज़ चैनल जैसी होनी चाहिए।
विषय: ${prompt}`;
    } 
    
    // 3. अगर यूजर को STORY चाहिए
    else if (type === "story" || prompt.toLowerCase().includes("kahani") || prompt.toLowerCase().includes("story")) {
      systemInstruction = `तुम एक बेहतरीन हिंदी कहानीकार हो। 
नीचे दिए गए विषय पर एक 2 मिनट में पढ़ी जाने वाली (लगभग 300 शब्द) रोचक हिंदी कहानी लिखो।
कहानी में ** या ## जैसी फॉर्मेटिंग मत करना। पैराग्राफ सादे टेक्स्ट में होने चाहिए।
विषय: ${prompt}`;
    } 
    
    // 4. अगर कुछ भी स्पेसिफिक नहीं है, तो जनरल असिस्टेंट की तरह काम करे
    else {
      systemInstruction = `तुम एक हेल्पफुल हिंदी असिस्टेंट हो। 
यूजर जो भी पूछ रहा है (चाहे वह सवाल हो, स्क्रिप्ट हो या जानकारी), उसका जवाब हिंदी में दो।
सादा और स्पष्ट उत्तर लिखो।
यूजर का इनपुट: ${prompt}`;
    }

    const response = await fetch(HF_API, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.HF_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "Qwen/Qwen2.5-72B-Instruct",
        messages: [{ role: "user", content: systemInstruction }],
        max_tokens: 1500, // टोकन थोड़े बढ़ा दिए हैं ताकि Quiz पूरा आए
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
    let generated = data.choices?.[0]?.message?.content?.trim() || "डेटा जनरेट नहीं हो पाया।";

    // सफाई अभियान (Cleaning)
    generated = generated.replace(/<think>[\s\S]*?<\/think>/g, "");
    
    // Quiz में ** न हटाएं क्योंकि कभी-कभी वह जरुरी होता है, लेकिन अगर सादा टेक्स्ट चाहिए तो:
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
