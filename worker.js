export default {
  async fetch(request, env) {
    // CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    // Handle preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Only POST allowed
    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Only POST method allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    try {
      const body = await request.json();
      const topic = body.topic;

      if (!topic) {
        return new Response(
          JSON.stringify({ error: "Topic is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!env.GROQ_API_KEY) {
        return new Response(
          JSON.stringify({ error: "GROQ_API_KEY not set in Worker environment" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Prompt for Hindi YouTube Script
      const prompt = `
आप एक प्रोफेशनल YouTube स्क्रिप्ट राइटर हैं।
नीचे दिए गए टॉपिक पर हिंदी (उर्दू टोन) में एक पूरी YouTube वीडियो स्क्रिप्ट लिखिए।

टॉपिक: "${topic}"

नियम:
- स्क्रिप्ट साफ़, बोलने लायक और स्टेप-बाय-स्टेप हो
- कोई इमोजी नहीं
- कोई हैडिंग मार्कडाउन नहीं
- सिर्फ़ बोलने वाली स्क्रिप्ट हो
`;

      // Call GROQ API
      const groqResponse = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env.GROQ_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              { role: "system", content: "You are a helpful assistant." },
              { role: "user", content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 1200
          })
        }
      );

      const data = await groqResponse.json();

      const script =
        data?.choices?.[0]?.message?.content || "Script generate नहीं हो पाई";

      return new Response(
        JSON.stringify({ script }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } catch (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }
};
