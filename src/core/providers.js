import fetch from "node-fetch";

/**
 * ANKA-ASI Provider Katmani
 * Her saglayici OpenAI-uyumlu bir "chat completion" formatina cevrilir,
 * boylece agent kodu hangi saglayiciyi kullandigini bilmek zorunda kalmaz.
 */

const PROVIDERS = {
  openrouter: {
    url: "https://openrouter.ai/api/v1/chat/completions",
    key: () => process.env.OPENROUTER_API_KEY,
    model: "openrouter/free",
    headers: (key) => ({
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://anka-asi.local",
      "X-Title": "ANKA-ASI",
    }),
  },
  google: {
    // Gemini'nin OpenAI-uyumlu ucu
    url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    key: () => process.env.GOOGLE_API_KEY,
    model: "gemini-2.0-flash",
    headers: (key) => ({
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    }),
  },
  groq: {
    url: "https://api.groq.com/openai/v1/chat/completions",
    key: () => process.env.GROQ_API_KEY,
    model: "llama-3.3-70b-versatile",
    headers: (key) => ({
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    }),
  },
  nvidia: {
    url: "https://integrate.api.nvidia.com/v1/chat/completions",
    key: () => process.env.NVIDIA_API_KEY,
    model: "meta/llama-3.1-70b-instruct",
    headers: (key) => ({
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    }),
  },
  huggingface: {
    url: "https://api-inference.huggingface.co/v1/chat/completions",
    key: () => process.env.HUGGINGFACE_API_KEY,
    model: "meta-llama/Llama-3.1-8B-Instruct",
    headers: (key) => ({
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    }),
  },
};

/**
 * Bir agent icin, belirtilen saglayici sirasiyla dener.
 * Biri limit/hata verirse otomatik bir sonrakine gecer (fallback).
 * @param {string[]} providerOrder - denenecek saglayicilarin sirasi, orn: ["groq","openrouter"]
 * @param {{system:string, user:string}} prompt
 */
export async function callAgent(providerOrder, prompt) {
  const errors = [];

  for (const name of providerOrder) {
    const cfg = PROVIDERS[name];
    if (!cfg) continue;
    const key = cfg.key();
    if (!key) {
      errors.push(`${name}: API key tanimli degil (.env dosyasini kontrol et)`);
      continue;
    }

    try {
      const res = await fetch(cfg.url, {
        method: "POST",
        headers: cfg.headers(key),
        body: JSON.stringify({
          model: cfg.model,
          messages: [
            { role: "system", content: prompt.system },
            { role: "user", content: prompt.user },
          ],
          max_tokens: 1200,
        }),
      });

      if (!res.ok) {
        errors.push(`${name}: HTTP ${res.status}`);
        continue; // rate limit / hata -> siradaki saglayiciya gec
      }

      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content;
      if (text) {
        return { provider: name, text };
      }
      errors.push(`${name}: bos yanit`);
    } catch (err) {
      errors.push(`${name}: ${err.message}`);
    }
  }

  throw new Error(
    `Tum saglayicilar basarisiz oldu:\n${errors.join("\n")}`
  );
}

export const AVAILABLE_PROVIDERS = Object.keys(PROVIDERS);
