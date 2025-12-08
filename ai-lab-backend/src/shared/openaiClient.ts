import { OpenAIClient, AzureKeyCredential } from "@azure/openai";

const endpoint = process.env.OPENAI_ENDPOINT!;
const apiKey = process.env.OPENAI_API_KEY!;
const deploymentName = process.env.OPENAI_DEPLOYMENT_NAME!;

if (!endpoint || !apiKey || !deploymentName) {
  console.warn("[OpenAI] Missing OPENAI_* settings");
}

const client = new OpenAIClient(endpoint, new AzureKeyCredential(apiKey));

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function runChatCompletion(
  messages: ChatMessage[],
  maxTokens: number
): Promise<{ reply: string; tokensUsed: number }> {
  const result = await client.getChatCompletions(deploymentName, messages, {
    maxTokens
  });

  const choice = result.choices[0];
  const reply = choice?.message?.content ?? "";
  // POC-level usage estimate: if usage available, use it; else approximate.
  const usage = result.usage;
  const tokensUsed =
    (usage?.completionTokens ?? 0) +
    (usage?.promptTokens ?? 0) ||
    Math.round(reply.length / 4);

  return { reply, tokensUsed };
}

