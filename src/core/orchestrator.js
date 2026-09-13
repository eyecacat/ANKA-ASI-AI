import { AGENTS, AGENT_IDS } from "../agents/definitions.js";
import { callAgent } from "./providers.js";

/**
 * Kullanicinin sorusunu once Orkestrator'e gonderir,
 * hangi uzman(lar)in devreye girecegine karar verdirir,
 * sonra o uzman(lar)i sirayla/paralel calistirir.
 */
export async function routeAndRun(userMessage) {
  const orchestratorAgent = AGENTS.orchestrator;

  let routing;
  try {
    const result = await callAgent(orchestratorAgent.providerOrder, {
      system: orchestratorAgent.system,
      user: userMessage,
    });
    routing = JSON.parse(extractJson(result.text));
  } catch (err) {
    // Orkestrator basarisiz olursa, guvenli varsayilan: architect
    routing = { agents: ["architect"], reason: "orkestrator hatasi - varsayilan modul" };
  }

  const chosenIds = (routing.agents || []).filter((id) => AGENT_IDS.includes(id));
  if (chosenIds.length === 0) chosenIds.push("architect");

  const responses = await Promise.all(
    chosenIds.map(async (id) => {
      const agent = AGENTS[id];
      try {
        const result = await callAgent(agent.providerOrder, {
          system: agent.system,
          user: userMessage,
        });
        return { agentId: id, name: agent.name, provider: result.provider, text: result.text };
      } catch (err) {
        return { agentId: id, name: agent.name, error: err.message };
      }
    })
  );

  return { reason: routing.reason, responses };
}

function extractJson(text) {
  const match = text.match(/\{[\s\S]*\}/);
  return match ? match[0] : text;
}
