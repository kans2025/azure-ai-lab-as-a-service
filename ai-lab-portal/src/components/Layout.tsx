import React, { PropsWithChildren } from "react";
import NavBar from "./NavBar";

const Layout: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <NavBar />
      <main style={{ padding: "1.5rem", flex: 1, background: "#f3f4f6" }}>{children}</main>
    </div>
  );
};

export default Layout;

