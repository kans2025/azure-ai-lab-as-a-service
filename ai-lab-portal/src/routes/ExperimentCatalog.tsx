import React, { useEffect, useState } from "react";
import { useMsal } from "@azure/msal-react";
import { Link } from "react-router-dom";
import { apiGet } from "../api/client";
import { AIExperiment } from "../types/api";

const ExperimentCatalog: React.FC = () => {
  const { instance, accounts } = useMsal();
  const account = accounts[0];

  const [experiments, setExperiments] = useState<AIExperiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!account) return;

    const load = async () => {
      try {
        setLoading(true);
        const data = await apiGet<AIExperiment[]>(instance, account, "/experiments");
        setExperiments(data);
      } catch (err: any) {
        console.error(err);
        setError(err?.message ?? "Failed to load experiments");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [instance, account]);

  if (!account) return <div>No signed-in account.</div>;
  if (loading) return <div>Loading experiments...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;

  return (
    <div>
      <h2>Experiment Catalog</h2>
      <p>Select a guided AI lab experiment.</p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginTop: "1rem" }}>
        {experiments.map((exp) => (
          <div
            key={exp.id}
            style={{
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              padding: "1rem",
              width: 280,
              background: "white"
            }}
          >
            <h3>{exp.title}</h3>
            <p style={{ fontSize: "0.9rem", color: "#4b5563", minHeight: 60 }}>{exp.description}</p>
            <p style={{ fontSize: "0.8rem", color: "#6b7280" }}>
              Tiers: {exp.tierIds.join(", ")}
            </p>
            <Link
              to={`/experiments/${exp.id}`}
              style={{
                display: "inline-block",
                marginTop: "0.5rem",
                padding: "0.4rem 0.8rem",
                borderRadius: 6,
                border: "none",
                background: "#2563eb",
                color: "white",
                textDecoration: "none",
                fontSize: "0.9rem"
              }}
            >
              Open Console
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExperimentCatalog;

