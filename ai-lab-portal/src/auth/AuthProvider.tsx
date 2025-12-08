import React, { PropsWithChildren } from "react";
import { MsalProvider } from "@azure/msal-react";
import { pca } from "./msalConfig";

export const AuthProvider: React.FC<PropsWithChildren> = ({ children }) => {
  return <MsalProvider instance={pca}>{children}</MsalProvider>;
};

