import React, { useEffect, useState } from "react";
import { useMsal } from "@azure/msal-react";
import { apiDelete, apiGet, apiPost } from "../api/client";
import { Environment, Subscription } from "../types/api";

const Environments: React.FC = () => {
  const { instance, accounts } = useMsal();
  const account = accounts[0];

  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newEnvName, setNewEnvName] = useState("");
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string>("");

  const loadData = async () => {
    if (!account) return;

    try {
      setLoading(true);
      setError(null);

      const [envs, subs] = await Promise.all([
        apiGet<Environment[]>(instance, account, "/environments"),
        apiGet<Subscription[]>(instance, account, "/subscriptions")
      ]);

      setEnvironments(envs);
      setSubscriptions(subs);
      if (subs.length > 0 && !selectedSubscriptionId) {
        setSelectedSubscriptionId(subs[0].id);
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? "Failed to load environments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instance, account]);

  const handleCreate = async () => {
    if (!account || !selectedSubscriptionId || !newEnvName.trim()) return;
    setCreating(true);
    setError(null);

    try {
      await apiPost<Environment>(instance, account, "/environments", {
        subscriptionId: selectedSubscriptionId,
        name: newEnvName
        // optional: tierId, region
      });
      setNewEnvName("");
      await loadData();
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.error ?? err?.message ?? "Failed to create environment");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (envId: string) => {
    if (!account) return;
    if (!window.confirm("Delete this environment? This will deprovision lab resources (POC).")) return;

    try {
      await apiDelete(instance, account, `/environments/${envId}`);
      await loadData();
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.error ?? err?.message ?? "Failed to delete environment");
    }
  };

  if (!account) return <div>No signed-in account.</div>;
  if (loading) return <div>Loading environments...</div>;

  return (
    <div>
      <h2>Environments</h2>
      <p>Manage AI lab environments provisioned for your subscriptions.</p>

      {error && <div style={{ color: "red", marginBottom: "1rem" }}>{error}</div>}

      <section style={{ marginTop: "1rem", marginBottom: "1.5rem" }}>
        <h3>Create Environment</h3>
        {subscriptions.length === 0 ? (
          <p>You need a subscription first. Go to the Tiers page.</p>
        ) : (
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="Environment name"
              value={newEnvName}
              onChange={(e) => setNewEnvName(e.target.value)}
              style={{ padding: "0.4rem 0.6rem", borderRadius: 4, border: "1px solid #d1d5db" }}
            />
            <select
              value={selectedSubscriptionId}
              onChange={(e) => setSelectedSubscriptionId(e.target.value)}
              style={{ padding: "0.4rem 0.6rem", borderRadius: 4, border: "1px solid #d1d5db" }}
            >
              {subscriptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.tierId} – {s.id.slice(0, 8)} (credits: {s.creditsRemaining})
                </option>
              ))}
            </select>
            <button
              onClick={() => void handleCreate()}
              disabled={creating}
              style={{
                padding: "0.4rem 0.9rem",
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
                background: "#2563eb",
                color: "white",
                fontWeight: 600
              }}
            >
              {creating ? "Creating..." : "Create"}
            </button>
          </div>
        )}
      </section>

      <section>
        <h3>Existing Environments</h3>
        {environments.length === 0 ? (
          <p>No environments yet.</p>
        ) : (
          <table style={{ borderCollapse: "collapse", width: "100%", maxWidth: 900 }}>
            <thead>
              <tr>
                <th style={{ borderBottom: "1px solid #e5e7eb", textAlign: "left", padding: "0.5rem" }}>Name</th>
                <th style={{ borderBottom: "1px solid #e5e7eb", textAlign: "left", padding: "0.5rem" }}>Tier</th>
                <th style={{ borderBottom: "1px solid #e5e7eb", textAlign: "left", padding: "0.5rem" }}>
                  Resource Group
                </th>
                <th style={{ borderBottom: "1px solid #e5e7eb", textAlign: "left", padding: "0.5rem" }}>Status</th>
                <th style={{ borderBottom: "1px solid #e5e7eb", textAlign: "left", padding: "0.5rem" }}>
                  Expires
                </th>
                <th style={{ borderBottom: "1px solid #e5e7eb", padding: "0.5rem" }} />
              </tr>
            </thead>
            <tbody>
              {environments.map((env) => (
                <tr key={env.id}>
                  <td style={{ padding: "0.5rem", borderBottom: "1px solid #f3f4f6" }}>{env.name}</td>
                  <td style={{ padding: "0.5rem", borderBottom: "1px solid #f3f4f6" }}>{env.tierId}</td>
                  <td style={{ padding: "0.5rem", borderBottom: "1px solid #f3f4f6" }}>{env.resourceGroupName}</td>
                  <td style={{ padding: "0.5rem", borderBottom: "1px solid #f3f4f6" }}>{env.status}</td>
                  <td style={{ padding: "0.5rem", borderBottom: "1px solid #f3f4f6" }}>
                    {new Date(env.expiresAt).toLocaleString()}
                  </td>
                  <td style={{ padding: "0.5rem", borderBottom: "1px solid #f3f4f6", textAlign: "right" }}>
                    <button
                      onClick={() => void handleDelete(env.id)}
                      style={{
                        padding: "0.3rem 0.6rem",
                        borderRadius: 4,
                        border: "1px solid #fca5a5",
                        background: "#fef2f2",
                        color: "#b91c1c",
                        cursor: "pointer",
                        fontSize: "0.8rem"
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
};

export default Environments;

