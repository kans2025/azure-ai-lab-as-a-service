import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useMsal } from "@azure/msal-react";

const NavBar: React.FC = () => {
  const { instance, accounts } = useMsal();
  const account = accounts[0];
  const location = useLocation();

  const handleLogout = () => {
    instance.logoutRedirect();
  };

  const linkStyle = (path: string): React.CSSProperties => ({
    marginRight: "1rem",
    textDecoration: "none",
    color: location.pathname.startsWith(path) ? "#1d4ed8" : "#111827",
    fontWeight: location.pathname.startsWith(path) ? 600 : 400
  });

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0.75rem 1.5rem",
        borderBottom: "1px solid #e5e7eb",
        background: "white"
      }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <span style={{ fontWeight: 700, marginRight: "2rem" }}>AI LAB</span>
        <nav>
          <Link to="/dashboard" style={linkStyle("/dashboard")}>
            Dashboard
          </Link>
          <Link to="/tiers" style={linkStyle("/tiers")}>
            Tiers
          </Link>
          <Link to="/environments" style={linkStyle("/environments")}>
            Environments
          </Link>
          <Link to="/experiments" style={linkStyle("/experiments")}>
            Experiments
          </Link>
        </nav>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {account && (
          <span style={{ fontSize: "0.875rem", color: "#4b5563" }}>
            {account.name ?? account.username}
          </span>
        )}
        <button
          onClick={handleLogout}
          style={{
            padding: "0.4rem 0.9rem",
            borderRadius: 6,
            border: "1px solid #d1d5db",
            background: "white",
            cursor: "pointer"
          }}
        >
          Sign out
        </button>
      </div>
    </header>
  );
};

export default NavBar;

