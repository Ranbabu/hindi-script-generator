export default {
  async fetch(req, env) {

    if(req.method!=="POST")
      return new Response("POST only",{status:405});

    const body=await req.json();

    const r=await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "Authorization":`Bearer ${env.GROQ_API_KEY}`
        },
        body:JSON.stringify({
          model:"llama-3.1-8b-instant",
          messages:body.messages,
          max_tokens:1800,
          temperature:.7
        })
      }
    );

    const data=await r.json();

    return new Response(JSON.stringify(data),{
      headers:{
        "Access-Control-Allow-Origin":"*",
        "Content-Type":"application/json"
      }
    });
  }
};
