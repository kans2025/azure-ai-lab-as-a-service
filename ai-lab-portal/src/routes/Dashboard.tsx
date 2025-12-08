import React, { useEffect, useState } from "react";
import { useMsal } from "@azure/msal-react";
import { apiGet } from "../api/client";
import { Environment, UsageCreditSummary, UserProfile } from "../types/api";

interface DashboardData {
  profile: UserProfile | null;
  credits: UsageCreditSummary[];
  environments: Environment[];
}

const Dashboard: React.FC = () => {
  const { instance, accounts } = useMsal();
  const account = accounts[0];

  const [data, setData] = useState<DashboardData>({
    profile: null,
    credits: [],
    environments: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!account) return;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const [profile, credits, envs] = await Promise.all([
          apiGet<UserProfile>(instance, account, "/me"),
          apiGet<UsageCreditSummary[]>(instance, account, "/usage/credits"),
          apiGet<Environment[]>(instance, account, "/environments")
        ]);

        setData({ profile, credits, environments: envs });
      } catch (err: any) {
        console.error(err);
        setError(err?.message ?? "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [instance, account]);

  if (!account) {
    return <div>No signed-in account found.</div>;
  }

  if (loading) return <div>Loading dashboard...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;

  const { profile, credits, environments } = data;

  return (
    <div>
      <h2>Dashboard</h2>
      {profile && (
        <>
          <p>
            Welcome, <strong>{profile.displayName}</strong>
          </p>
          <p>Tenant: {profile.tenantId}</p>
        </>
      )}

      <section style={{ marginTop: "1.5rem" }}>
        <h3>Credits</h3>
        {credits.length === 0 ? (
          <p>No subscriptions yet. Go to the Tiers page to create one.</p>
        ) : (
          <ul>
            {credits.map((c) => (
              <li key={c.id}>
                Tier <strong>{c.tierId}</strong>: {c.creditsRemaining} / {c.prepaidCredits} credits remaining
              </li>
            ))}
          </ul>
        )}
      </section>

      <section style={{ marginTop: "1.5rem" }}>
        <h3>Active Environments</h3>
        {environments.length === 0 ? (
          <p>No environments. Use the Environments page to create a lab.</p>
        ) : (
          <table style={{ borderCollapse: "collapse", width: "100%", maxWidth: 800 }}>
            <thead>
              <tr>
                <th style={{ borderBottom: "1px solid #e5e7eb", textAlign: "left", padding: "0.5rem" }}>
                  Name
                </th>
                <th style={{ borderBottom: "1px solid #e5e7eb", textAlign: "left", padding: "0.5rem" }}>
                  Tier
                </th>
                <th style={{ borderBottom: "1px solid #e5e7eb", textAlign: "left", padding: "0.5rem" }}>
                  Status
                </th>
                <th style={{ borderBottom: "1px solid #e5e7eb", textAlign: "left", padding: "0.5rem" }}>
                  Expires At
                </th>
              </tr>
            </thead>
            <tbody>
              {environments.map((env) => (
                <tr key={env.id}>
                  <td style={{ padding: "0.5rem", borderBottom: "1px solid #f3f4f6" }}>{env.name}</td>
                  <td style={{ padding: "0.5rem", borderBottom: "1px solid #f3f4f6" }}>{env.tierId}</td>
                  <td style={{ padding: "0.5rem", borderBottom: "1px solid #f3f4f6" }}>{env.status}</td>
                  <td style={{ padding: "0.5rem", borderBottom: "1px solid #f3f4f6" }}>
                    {new Date(env.expiresAt).toLocaleString()}
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

export default Dashboard;
