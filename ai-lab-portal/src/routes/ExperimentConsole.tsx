import React, { FormEvent, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import { apiGet, apiPost } from "../api/client";
import { AIExperiment, Environment, ExperimentRunResponse } from "../types/api";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const ExperimentConsole: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { instance, accounts } = useMsal();
  const account = accounts[0];

  const [experiment, setExperiment] = useState<AIExperiment | null>(null);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [selectedEnvId, setSelectedEnvId] = useState<string>("");

  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!account || !id) return;

    const load = async () => {
      try {
        setLoadingMeta(true);
        setError(null);

        const [exp, envs] = await Promise.all([
          apiGet<AIExperiment>(instance, account, `/experiments/${id}`),
          apiGet<Environment[]>(instance, account, "/environments")
        ]);

        setExperiment(exp);
        setEnvironments(envs);
        if (envs.length > 0) setSelectedEnvId(envs[0].id);
      } catch (err: any) {
        console.error(err);
        setError(err?.message ?? "Failed to load experiment");
      } finally {
        setLoadingMeta(false);
      }
    };

    void load();
  }, [instance, account, id]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!account || !id || !selectedEnvId || !input.trim()) return;

    const userMessage: ChatMessage = { role: "user", content: input };
    setChat((prev) => [...prev, userMessage]);
    setInput("");
    setSending(true);
    setError(null);

    try {
      const response = await apiPost<ExperimentRunResponse>(
        instance,
        account,
        `/experiments/${id}/run`,
        {
          environmentId: selectedEnvId,
          messages: [userMessage] // For simplicity, send only latest; backend adds system prompt
        }
      );

      setChat((prev) => [...prev, { role: "assistant", content: response.reply }]);
      setCreditsRemaining(response.creditsRemaining);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.error ?? err?.message ?? "Failed to run experiment");
    } finally {
      setSending(false);
    }
  };

  if (!account) return <div>No signed-in account.</div>;
  if (loadingMeta) return <div>Loading experiment console...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;
  if (!experiment) return <div>Experiment not found.</div>;

  return (
    <div style={{ maxWidth: 900 }}>
      <h2>{experiment.title}</h2>
      <p style={{ color: "#4b5563" }}>{experiment.description}</p>

      <div
        style={{
          marginTop: "0.75rem",
          padding: "0.75rem",
          borderRadius: 6,
          background: "#eff6ff",
          fontSize: "0.85rem",
          whiteSpace: "pre-line"
        }}
      >
        <strong>System Prompt (read-only)</strong>
        <div style={{ marginTop: "0.25rem" }}>{experiment.systemPrompt}</div>
      </div>

      <div style={{ marginTop: "0.75rem", marginBottom: "0.75rem", display: "flex", gap: "0.75rem" }}>
        <div>
          <label style={{ fontSize: "0.85rem" }}>Environment</label>
          <br />
          <select
            value={selectedEnvId}
            onChange={(e) => setSelectedEnvId(e.target.value)}
            style={{ padding: "0.4rem 0.6rem", borderRadius: 4, border: "1px solid #d1d5db", minWidth: 220 }}
          >
            {environments.map((env) => (
              <option key={env.id} value={env.id}>
                {env.name} ({env.tierId})
              </option>
            ))}
          </select>
        </div>
        {creditsRemaining !== null && (
          <div style={{ fontSize: "0.85rem", color: "#4b5563", alignSelf: "flex-end" }}>
            Credits remaining: <strong>{creditsRemaining}</strong>
          </div>
        )}
      </div>

      <div
        style={{
          borderRadius: 8,
          border: "1px solid #e5e7eb",
          background: "white",
          padding: "0.75rem",
          minHeight: 240,
          maxHeight: 400,
          overflowY: "auto"
        }}
      >
        {chat.length === 0 ? (
          <p style={{ color: "#9ca3af" }}>Send a prompt to start the experiment.</p>
        ) : (
          chat.map((m, idx) => (
            <div
              key={idx}
              style={{
                marginBottom: "0.5rem",
                textAlign: m.role === "user" ? "right" : "left"
              }}
            >
              <div
                style={{
                  display: "inline-block",
                  padding: "0.4rem 0.6rem",
                  borderRadius: 6,
                  background: m.role === "user" ? "#2563eb" : "#e5e7eb",
                  color: m.role === "user" ? "white" : "#111827",
                  maxWidth: "80%"
                }}
              >
                {m.content}
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSend} style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem" }}>
        <input
          type="text"
          placeholder="Ask your question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={sending}
          style={{
            flex: 1,
            padding: "0.5rem 0.7rem",
            borderRadius: 6,
            border: "1px solid #d1d5db"
          }}
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: 6,
            border: "none",
            background: "#2563eb",
            color: "white",
            cursor: "pointer",
            fontWeight: 600
          }}
        >
          {sending ? "Sending..." : "Send"}
        </button>
      </form>

      {experiment.samplePrompts?.length > 0 && (
        <div style={{ marginTop: "1rem" }}>
          <h4>Sample prompts</h4>
          <ul>
            {experiment.samplePrompts.map((s, idx) => (
              <li key={idx} style={{ fontSize: "0.9rem" }}>
                <button
                  type="button"
                  onClick={() => setInput(s)}
                  style={{
                    border: "none",
                    background: "none",
                    color: "#2563eb",
                    textAlign: "left",
                    padding: 0,
                    cursor: "pointer"
                  }}
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ExperimentConsole;

