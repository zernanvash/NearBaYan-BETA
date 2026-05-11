require('dotenv').config();
const { OpenAI } = require('openai');

let baseUrl = process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1";
if (baseUrl.endsWith('/chat/completions')) {
  baseUrl = baseUrl.replace(/\/chat\/completions$/, '');
}

const openaiClient = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: baseUrl,
});

async function test() {
  console.log('Sending to NIM...');
  const response = await openaiClient.chat.completions.create({
    model: process.env.NVIDIA_SAFETY_MODEL || "nvidia/llama-3.1-nemotron-safety-guard-8b-v3",
    messages: [
      {
        role: "system",
        content: "You are a strict community moderator. Review the following post. If it contains phishing, scams, illegal activities, or dangerous content, reply with 'FLAGGED: [Reason]'. If it is safe, reply with 'SAFE'."
      },
      { role: "user", content: 'This is a phishing link, please click here to claim your prize and enter your credit card details.' }
    ],
    temperature: 0.1,
    max_tokens: 50,
  });
  
  console.log('Raw output:', response.choices[0]?.message?.content);
}

test();
