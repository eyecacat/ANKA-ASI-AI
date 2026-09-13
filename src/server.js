import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { AGENTS, AGENT_IDS } from "./agents/definitions.js";
import { callAgent, AVAILABLE_PROVIDERS } from "./core/providers.js";
import { routeAndRun } from "./core/orchestrator.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

// Sistem durumu - hangi API key'ler tanimli
app.get("/api/status", (req, res) => {
  const configured = AVAILABLE_PROVIDERS.filter(
    (p) => process.env[`${p.toUpperCase()}_API_KEY`]
  );
  res.json({
    providers: AVAILABLE_PROVIDERS,
    configured,
    agents: AGENT_IDS.map((id) => ({ id, name: AGENTS[id].name })),
  });
});

// Tek bir uzmani direkt cagirma (kullanici modul seciyorsa)
app.post("/api/agent/:agentId", async (req, res) => {
  const { agentId } = req.params;
  const { message } = req.body;
  const agent = AGENTS[agentId];

  if (!agent) return res.status(404).json({ error: "Modul bulunamadi" });
  if (!message) return res.status(400).json({ error: "message alani gerekli" });

  try {
    const result = await callAgent(agent.providerOrder, {
      system: agent.system,
      user: message,
    });
    res.json({ agentId, name: agent.name, ...result });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

// Orkestrator uzerinden otomatik yonlendirme
app.post("/api/ask", async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "message alani gerekli" });

  try {
    const result = await routeAndRun(message);
    res.json(result);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`ANKA-ASI sunucusu http://localhost:${PORT} adresinde calisiyor`);
});
