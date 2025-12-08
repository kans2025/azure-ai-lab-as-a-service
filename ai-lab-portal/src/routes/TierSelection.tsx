import React, { useEffect, useState } from "react";
import { useMsal } from "@azure/msal-react";
import { apiGet, apiPost } from "../api/client";
import { Subscription, TierDefinition } from "../types/api";

const TierSelection: React.FC = () => {
  const { instance, accounts } = useMsal();
  const account = accounts[0];

  const [tiers, setTiers] = useState<TierDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!account) return;

    const load = async () => {
      try {
        setLoading(true);
        const data = await apiGet<TierDefinition[]>(instance, account, "/tiers");
        setTiers(data);
      } catch (err: any) {
        console.error(err);
        setError(err?.message ?? "Failed to load tiers");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [instance, account]);

  const handleCreateSubscription = async (tierId: string) => {
    if (!account) return;
    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const sub = await apiPost<Subscription>(instance, account, "/subscriptions", {
        tierId
        // prepaidCredits: optional override
      });

      setMessage(`Subscription created for tier "${sub.tierId}" with ${sub.prepaidCredits} credits.`);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.error ?? err?.message ?? "Failed to create subscription");
    } finally {
      setSubmitting(false);
    }
  };

  if (!account) return <div>No signed-in account.</div>;
  if (loading) return <div>Loading tiers...</div>;

  return (
    <div>
      <h2>Select a Tier</h2>
      <p>Choose a prepaid AI lab tier. For POC, this simulates subscription purchase.</p>

      {error && <div style={{ color: "red", marginBottom: "1rem" }}>{error}</div>}
      {message && <div style={{ color: "green", marginBottom: "1rem" }}>{message}</div>}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginTop: "1rem" }}>
        {tiers.map((tier) => (
          <div
            key={tier.id}
            style={{
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              padding: "1rem",
              width: 260,
              background: "white"
            }}
          >
            <h3>{tier.name}</h3>
            <p style={{ fontSize: "0.9rem", color: "#4b5563" }}>{tier.description}</p>
            <p style={{ fontSize: "0.85rem", color: "#6b7280" }}>
              Default credits: <strong>{tier.defaultCredits}</strong>
            </p>
            <p style={{ fontSize: "0.8rem", color: "#6b7280" }}>
              Max environments: {tier.limits.maxEnvironments}
            </p>
            <button
              disabled={submitting}
              onClick={() => void handleCreateSubscription(tier.id)}
              style={{
                marginTop: "0.75rem",
                padding: "0.5rem 1rem",
                width: "100%",
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
                background: "#2563eb",
                color: "white",
                fontWeight: 600
              }}
            >
              {submitting ? "Creating..." : "Create Subscription"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TierSelection;

