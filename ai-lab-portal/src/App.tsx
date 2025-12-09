import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import Layout from "./components/Layout";
import Dashboard from "./routes/Dashboard";
import TierSelection from "./routes/TierSelection";
import Environments from "./routes/Environments";
import ExperimentCatalog from "./routes/ExperimentCatalog";
import ExperimentConsole from "./routes/ExperimentConsole";
import { loginRequest } from "./auth/msalConfig";

const App: React.FC = () => {
  const isAuthenticated = useIsAuthenticated();
  const { instance } = useMsal();

  const handleLogin = () => {
  instance.loginRedirect(loginRequest);
  };


  if (!isAuthenticated) {
    return (
      <div style={{ padding: "3rem", maxWidth: 600 }}>
        <h1>AI LAB AS A SERVICE</h1>
        <p>
          Controlled, tier-based Azure AI lab environments for students and corporate innovation teams.
        </p>
        <button
          onClick={handleLogin}
          style={{
            padding: "0.75rem 1.5rem",
            borderRadius: 6,
            border: "none",
            cursor: "pointer",
            background: "#2563eb",
            color: "white",
            fontWeight: 600
          }}
        >
          Sign in with Azure Entra ID
        </button>
      </div>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tiers" element={<TierSelection />} />
        <Route path="/environments" element={<Environments />} />
        <Route path="/experiments" element={<ExperimentCatalog />} />
        <Route path="/experiments/:id" element={<ExperimentConsole />} />
      </Routes>
    </Layout>
  );
};

export default App;
